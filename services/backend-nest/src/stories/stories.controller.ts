import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { dummyStore } from '../dummy-store';

interface SubmitStoryDto {
  title: string;
  content: string;
  metrics?: {
    familiesServed?: number;
    tripsCompleted?: number;
    earningsMonth?: number;
    timeSaved?: string;
  };
}

@Controller('api/stories')
export class StoriesController {
  // Parent/Driver submits a story
  @Post('submit')
  async submitStory(@Body() body: SubmitStoryDto & { authorPhone: string; authorRole: 'driver' | 'parent' }) {
    try {
      // TODO: Later, extract authorPhone from JWT token
      const story = dummyStore.submitStory(body.authorPhone, body.authorRole, body.title, body.content, body.metrics);
      return { success: true, story };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get approved stories (public feed)
  @Get('')
  async getApprovedStories() {
    try {
      const stories = dummyStore.getStoriesApproved();
      return { success: true, stories };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Admin: Get pending stories for approval
  @Get('pending')
  async getPendingStories() {
    try {
      // TODO: Later, verify admin role via JWT
      const stories = dummyStore.getStoriesPending();
      return { success: true, stories };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Admin: Approve a story
  @Post(':storyId/approve')
  async approveStory(@Param('storyId') storyId: string) {
    try {
      // TODO: Later, verify admin role via JWT
      const story = dummyStore.approveStory(storyId);
      if (!story) {
        return { success: false, error: 'Story not found' };
      }
      return { success: true, story };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Admin: Reject a story
  @Post(':storyId/reject')
  async rejectStory(@Param('storyId') storyId: string) {
    try {
      // TODO: Later, verify admin role via JWT
      const story = dummyStore.rejectStory(storyId);
      if (!story) {
        return { success: false, error: 'Story not found' };
      }
      return { success: true, story };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
