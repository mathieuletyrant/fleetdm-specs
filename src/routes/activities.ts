import { Router, Request, Response } from 'express';
import { ListActivitiesQuerySchema, ListActivitiesResponse } from '../schemas/activity';

const router = Router();

router.get('/activities', async (req: Request, res: Response) => {
  try {
    // Validate query parameters using Zod
    const queryParams = ListActivitiesQuerySchema.parse(req.query);

    // Mock response based on FleetDM documentation
    const response: ListActivitiesResponse = {
      activities: [
        {
          created_at: '2023-07-27T14:35:08Z',
          id: 25,
          actor_full_name: 'Anna Chao',
          actor_id: 3,
          actor_gravatar: '',
          actor_email: 'anna@example.com',
          type: 'installed_software',
          fleet_initiated: false,
          details: {
            status: 'installed',
            host_id: 1272,
            host_display_name: 'MacBook Pro',
            policy_id: null,
            policy_name: null,
            install_uuid: '23c18ea1-8cd7-4af4-a1d8-f2666993a66b',
            self_service: false,
            software_title: 'zoom.us.app',
            software_package: 'ZoomInstallerIT.pkg',
          },
        },
      ],
      meta: {
        has_next_results: false,
        has_previous_results: false,
      },
    };

    res.json(response);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({
        message: 'Invalid query parameters',
        errors: error.errors,
      });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
});

export { router as activitiesRouter };
