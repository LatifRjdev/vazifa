import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Import models
import User from './models/users.js';
import Organization from './models/organization.js';
import Workspace from './models/workspace.js';
import Task from './models/tasks.js';

dotenv.config();

async function cleanupAllWorkspaces() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Delete all organizations
    const deletedOrgs = await Organization.deleteMany({});
    console.log(`Deleted ${deletedOrgs.deletedCount} organizations`);

    // 2. Delete all workspaces
    const deletedWorkspaces = await Workspace.deleteMany({});
    console.log(`Deleted ${deletedWorkspaces.deletedCount} workspaces`);

    // 3. Update all users to remove workspace and organization references
    const updatedUsers = await User.updateMany(
      {},
      {
        $unset: {
          workspace: 1,
          organization: 1,
          workspaces: 1,
          organizations: 1
        }
      }
    );
    console.log(`Updated ${updatedUsers.modifiedCount} users`);

    // 4. Update all tasks to remove workspace and organization references
    const updatedTasks = await Task.updateMany(
      {},
      {
        $unset: {
          workspace: 1,
          organization: 1
        }
      }
    );
    console.log(`Updated ${updatedTasks.modifiedCount} tasks`);

    console.log('✅ Successfully cleaned up all workspaces and organizations');
    console.log('All users are now in a global space without workspace/organization constraints');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

cleanupAllWorkspaces();
