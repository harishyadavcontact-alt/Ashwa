import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import type { SharedRideGroup } from '@ashwa/shared';

@Injectable()
export class SharedRidesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Find potential shared ride matches for parents on same service
   * Groups parents by geospatial proximity and time window
   */
  async findSharedRideMatches(
    serviceId: string,
    driverId: string,
    timeWindowMinutes: number = 30,
  ): Promise<SharedRideGroup[]> {
    try {
      // Get all active enrollments for this service
      const enrollments = await this.prisma.serviceEnrollment.findMany({
        where: {
          serviceId,
          status: 'ACTIVE',
          enrollmentType: 'ALONE',
        },
        include: {
          child: {
            select: {
              id: true,
              name: true,
              pickupLat: true,
              pickupLng: true,
              pickupAddress: true,
              dropLat: true,
              dropLng: true,
              dropAddress: true,
            },
          },
          parent: {
            select: {
              userId: true,
              name: true,
            },
          },
          service: {
            select: {
              startTime: true,
              capacity: true,
            },
          },
        },
      });

      if (enrollments.length < 2) {
        return [];
      }

      // Group by geospatial proximity
      const groups = this.clusterByProximity(enrollments, timeWindowMinutes);
      const sharedRideGroups: SharedRideGroup[] = [];

      for (const group of groups) {
        if (group.length >= 2) {
          const parentIds = group.map((e) => e.parent.userId);
          const childIds = group.map((e) => e.child.id);
          const pricePerParent = this.calculatePrice(group.length);

          const pickupCoords = group.map((e) => ({
            lat: e.child.pickupLat,
            lng: e.child.pickupLng,
            address: e.child.pickupAddress,
          }));

          const dropCoords = group.map((e) => ({
            lat: e.child.dropLat,
            lng: e.child.dropLng,
            address: e.child.dropAddress,
          }));

          const createdGroup = await this.prisma.sharedRideGroup.create({
            data: {
              serviceId,
              driverId,
              parentIds: JSON.stringify(parentIds),
              childIds: JSON.stringify(childIds),
              startDate: new Date(),
              status: 'FORMING',
              pricePerParent,
              seatsUsed: group.length,
              pickupCoords,
              dropCoords,
            },
          });

          sharedRideGroups.push(this.mapPrismaGroupToType(createdGroup));
        }
      }

      return sharedRideGroups;
    } catch (error) {
      console.error('Error finding shared ride matches:', error);
      throw error;
    }
  }

  /**
   * Get available ride options for a parent enrolling in a service
   */
  async getRideOptions(serviceId: string, childId: string): Promise<any> {
    try {
      const child = await this.prisma.child.findUnique({
        where: { id: childId },
        include: { parent: { select: { userId: true, name: true } } },
      });

      if (!child) {
        throw new Error('Child not found');
      }

      const aloneOption = {
        type: 'ALONE',
        price: 200,
        savings: 0,
        capacity: 1,
      };

      const existingGroups = await this.prisma.sharedRideGroup.findMany({
        where: {
          serviceId,
          status: 'FORMING',
        },
      });

      const options: any = {
        alone: aloneOption,
      };

      for (const group of existingGroups) {
        const parentIds = JSON.parse(group.parentIds) as string[];
        if (parentIds.length === 1) {
          options.shared2 = {
            option: {
              type: 'SHARED_2',
              price: 150,
              savings: 50,
              capacity: 2,
            },
            families: [parentIds[0]],
          };
          break;
        }
      }

      for (const group of existingGroups) {
        const parentIds = JSON.parse(group.parentIds) as string[];
        if (parentIds.length >= 2 && parentIds.length < 4) {
          options.shared3Plus = {
            option: {
              type: 'SHARED_3PLUS',
              price: 120,
              savings: 80,
              capacity: parentIds.length + 1,
            },
            families: parentIds,
          };
          break;
        }
      }

      return options;
    } catch (error) {
      console.error('Error getting ride options:', error);
      throw error;
    }
  }

  /**
   * Enroll parent in a shared ride
   */
  async enrollInSharedRide(
    enrollmentId: string,
    groupId: string,
    enrollmentType: 'ALONE' | 'SHARED' = 'ALONE',
  ): Promise<any> {
    try {
      const enrollment = await this.prisma.serviceEnrollment.findUnique({
        where: { id: enrollmentId },
      });

      if (!enrollment) {
        throw new Error('Enrollment not found');
      }

      let pricePerMonth = 200;

      if (enrollmentType === 'SHARED') {
        const group = await this.prisma.sharedRideGroup.findUnique({
          where: { id: groupId },
        });

        if (!group) {
          throw new Error('Shared ride group not found');
        }

        pricePerMonth = group.pricePerParent;
      }

      const updated = await this.prisma.serviceEnrollment.update({
        where: { id: enrollmentId },
        data: {
          enrollmentType,
          sharedGroupId: enrollmentType === 'SHARED' ? groupId : null,
          pricePerMonth,
        },
      });

      return updated;
    } catch (error) {
      console.error('Error enrolling in shared ride:', error);
      throw error;
    }
  }

  /**
   * Get driver's seat allocation for a service
   */
  async getDriverSeatAllocation(driverId: string, serviceId: string): Promise<any> {
    try {
      const service = await this.prisma.service.findUnique({
        where: { id: serviceId },
        include: {
          enrollments: {
            include: {
              parent: { select: { userId: true, name: true } },
              child: {
                select: {
                  id: true,
                  name: true,
                  pickupAddress: true,
                },
              },
            },
          },
          sharedRideGroups: true,
        },
      });

      if (!service || service.driverId !== driverId) {
        throw new Error('Service not found or unauthorized');
      }

      const totalCapacity = service.capacity || 12;
      const aloneCount = service.enrollments.filter((e) => e.enrollmentType === 'ALONE').length;
      const sharedEnrollments = service.enrollments.filter((e) => e.enrollmentType === 'SHARED');

      let totalEarnings = aloneCount * 200;
      let totalSeatsUsed = aloneCount;
      let sharedGroupCount = 0;

      for (const group of service.sharedRideGroups) {
        const parentIds = JSON.parse(group.parentIds) as string[];
        const groupSize = parentIds.length;
        if (groupSize >= 2) {
          totalEarnings += groupSize * group.pricePerParent;
          totalSeatsUsed += groupSize;
          sharedGroupCount += 1;
        }
      }

      const costSavings = sharedEnrollments.length * 50 +
        (sharedEnrollments.length >= 3 ? (sharedEnrollments.length - 2) * 30 : 0);

      return {
        serviceId,
        serviceName: service.name,
        totalCapacity,
        bookedSeats: totalSeatsUsed,
        aloneRiders: aloneCount,
        sharedGroups: sharedGroupCount,
        totalEarnings,
        costSavings,
        utilization: `${totalSeatsUsed}/${totalCapacity} seats`,
      };
    } catch (error) {
      console.error('Error getting seat allocation:', error);
      throw error;
    }
  }

  private clusterByProximity(enrollments: any[], timeWindowMinutes: number): any[][] {
    const clusters: any[][] = [];
    const visited = new Set<string>();

    for (const enrollment of enrollments) {
      if (visited.has(enrollment.id)) continue;

      const cluster = [enrollment];
      visited.add(enrollment.id);

      for (const other of enrollments) {
        if (visited.has(other.id)) continue;

        const distance = this.haversineDistance(
          enrollment.child.pickupLat,
          enrollment.child.pickupLng,
          other.child.pickupLat,
          other.child.pickupLng,
        );

        if (distance < 2) {
          cluster.push(other);
          visited.add(other.id);
        }
      }

      if (cluster.length >= 1) {
        clusters.push(cluster);
      }
    }

    return clusters;
  }

  private haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private calculatePrice(groupSize: number): number {
    if (groupSize === 1) return 200;
    if (groupSize === 2) return 150;
    return 120;
  }

  private mapPrismaGroupToType(group: any): SharedRideGroup {
    return {
      id: group.id,
      serviceId: group.serviceId,
      driverId: group.driverId,
      parentIds: JSON.parse(group.parentIds),
      childIds: JSON.parse(group.childIds),
      startDate: group.startDate.toISOString(),
      status: group.status,
      pricePerParent: group.pricePerParent,
      seatsUsed: group.seatsUsed,
      pickupCoords: group.pickupCoords,
      dropCoords: group.dropCoords,
      createdAt: group.createdAt.toISOString(),
    };
  }
}
