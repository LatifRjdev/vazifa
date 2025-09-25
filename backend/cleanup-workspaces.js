import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Workspace from './models/workspace.js';
import Project from './models/projects.js';
import Task from './models/tasks.js';
import ActivityLog from './models/activity-logs.js';
import WorkspaceInvite from './models/workspace-invites.js';
import User from './models/users.js';

dotenv.config();

const cleanupWorkspaces = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the admin user
    const adminUser = await User.findOne({ role: 'super_admin' });
    if (!adminUser) {
      console.log('❌ Admin user not found. Please run create-admin-user.js first');
      process.exit(1);
    }

    console.log('🔍 Finding all workspaces...');
    const allWorkspaces = await Workspace.find({});
    console.log(`📊 Found ${allWorkspaces.length} workspaces`);

    // Check if default workspace already exists
    let defaultWorkspace = await Workspace.findOne({ 
      name: 'Рабочее пространство',
      owner: adminUser._id 
    });

    if (!defaultWorkspace) {
      console.log('🏗️ Creating default workspace...');
      defaultWorkspace = await Workspace.create({
        name: 'Default Workspace',
        description: '',
        color: '#3b82f6',
        owner: adminUser._id,
        members: [
          {
            user: adminUser._id,
            role: 'owner',
            joinedAt: new Date(),
          },
        ],
      });
      console.log('✅ Default workspace created');
    } else {
      console.log('✅ Default workspace already exists');
    }

    // Get all workspaces except the default one
    const workspacesToDelete = await Workspace.find({ 
      _id: { $ne: defaultWorkspace._id } 
    });

    console.log(`🗑️ Deleting ${workspacesToDelete.length} workspaces...`);

    for (const workspace of workspacesToDelete) {
      console.log(`Deleting workspace: ${workspace.name}`);
      
      // Find all projects in this workspace
      const projects = await Project.find({ workspace: workspace._id });
      
      for (const project of projects) {
        // Delete all tasks in this project
        await Task.deleteMany({ project: project._id });
        console.log(`  - Deleted tasks for project: ${project.title}`);
      }
      
      // Delete all projects in this workspace
      await Project.deleteMany({ workspace: workspace._id });
      console.log(`  - Deleted projects for workspace: ${workspace.name}`);
      
      // Delete activity logs for this workspace
      await ActivityLog.deleteMany({ resourceId: workspace._id });
      console.log(`  - Deleted activity logs for workspace: ${workspace.name}`);
      
      // Delete workspace invites
      await WorkspaceInvite.deleteMany({ workspaceId: workspace._id });
      console.log(`  - Deleted invites for workspace: ${workspace.name}`);
      
      // Delete the workspace
      await workspace.deleteOne();
      console.log(`  ✅ Deleted workspace: ${workspace.name}`);
    }

    // Update all users to be members of the default workspace
    console.log('👥 Adding all users to default workspace...');
    const allUsers = await User.find({});
    
    for (const user of allUsers) {
      // Check if user is already a member of default workspace
      const isMember = defaultWorkspace.members.some(
        member => member.user.toString() === user._id.toString()
      );
      
      if (!isMember) {
        defaultWorkspace.members.push({
          user: user._id,
          role: user.role === 'super_admin' ? 'owner' : 'member',
          joinedAt: new Date(),
        });
        console.log(`  - Added ${user.name} to default workspace`);
      }
    }
    
    await defaultWorkspace.save();

    console.log('\n🎉 Cleanup completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`  - Deleted: ${workspacesToDelete.length} workspaces`);
    console.log(`  - Remaining: 1 default workspace`);
    console.log(`  - Default workspace: "${defaultWorkspace.name}"`);
    console.log(`  - Members in default workspace: ${defaultWorkspace.members.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
};

cleanupWorkspaces();
