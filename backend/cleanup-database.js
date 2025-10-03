import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/users.js";
import Task from "./models/tasks.js";
import Comment from "./models/comments.js";
import Response from "./models/responses.js";
import Notification from "./models/notifications.js";
import ActivityLog from "./models/activity-logs.js";
import Workspace from "./models/workspace.js";
import WorkspaceInvite from "./models/workspace-invites.js";
import Project from "./models/projects.js";
import AdminMessage from "./models/admin-messages.js";
import AdminChat from "./models/admin-chat.js";
import Verification from "./models/verification.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/vazifa";

async function cleanupDatabase() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Step 1: Find users to keep
    console.log("📋 Step 1: Identifying users to keep...");
    const usersToKeep = await User.find({
      $or: [
        { name: "Ахматов Фируз" },
        { email: "firatjk@gmail.com" },
        { role: { $in: ["super_admin", "admin", "manager"] } }
      ]
    });

    console.log(`✅ Found ${usersToKeep.length} users to keep:`);
    usersToKeep.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - Role: ${user.role}`);
    });

    const userIdsToKeep = usersToKeep.map(u => u._id.toString());

    // Step 2: Find users to delete
    console.log("\n📋 Step 2: Identifying users to delete...");
    const usersToDelete = await User.find({
      _id: { $nin: userIdsToKeep.map(id => new mongoose.Types.ObjectId(id)) }
    });

    console.log(`⚠️  Found ${usersToDelete.length} users to delete:`);
    usersToDelete.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - Role: ${user.role}`);
    });

    if (usersToDelete.length === 0) {
      console.log("✅ No users to delete.");
    } else {
      // Confirm deletion
      console.log("\n⚠️  WARNING: This will permanently delete these users!");
      console.log("Press Ctrl+C to cancel or wait 5 seconds to continue...");
      await new Promise(resolve => setTimeout(resolve, 5000));

      const userIdsToDelete = usersToDelete.map(u => u._id);

      // Delete users
      console.log("\n🗑️  Deleting users...");
      const deletedUsersResult = await User.deleteMany({
        _id: { $in: userIdsToDelete }
      });
      console.log(`✅ Deleted ${deletedUsersResult.deletedCount} users`);

      // Clean up workspace members
      console.log("\n🧹 Cleaning up workspace members...");
      const workspaceUpdateResult = await Workspace.updateMany(
        { "members.user": { $in: userIdsToDelete } },
        { $pull: { members: { user: { $in: userIdsToDelete } } } }
      );
      console.log(`✅ Updated ${workspaceUpdateResult.modifiedCount} workspaces`);

      // Transfer workspace ownership to first admin if owner was deleted
      console.log("\n🔄 Transferring workspace ownership...");
      const workspacesNeedingOwner = await Workspace.find({
        owner: { $in: userIdsToDelete }
      });
      
      if (workspacesNeedingOwner.length > 0) {
        const firstAdmin = usersToKeep.find(u => ["admin", "super_admin"].includes(u.role));
        if (firstAdmin) {
          for (const workspace of workspacesNeedingOwner) {
            workspace.owner = firstAdmin._id;
            await workspace.save();
            console.log(`   - Transferred ownership of "${workspace.name}" to ${firstAdmin.name}`);
          }
        } else {
          console.log("⚠️  No admin found to transfer workspace ownership!");
        }
      }

      // Clean up verification tokens
      console.log("\n🧹 Cleaning up verification tokens...");
      const verificationDeleteResult = await Verification.deleteMany({
        userId: { $in: userIdsToDelete }
      });
      console.log(`✅ Deleted ${verificationDeleteResult.deletedCount} verification tokens`);

      // Clean up workspace invites
      console.log("\n🧹 Cleaning up workspace invites...");
      const inviteDeleteResult = await WorkspaceInvite.deleteMany({
        $or: [
          { invitedBy: { $in: userIdsToDelete } },
          { invitedUser: { $in: userIdsToDelete } }
        ]
      });
      console.log(`✅ Deleted ${inviteDeleteResult.deletedCount} workspace invites`);

      // Clean up notifications
      console.log("\n🧹 Cleaning up notifications...");
      const notificationDeleteResult = await Notification.deleteMany({
        user: { $in: userIdsToDelete }
      });
      console.log(`✅ Deleted ${notificationDeleteResult.deletedCount} notifications`);
    }

    // Step 3: Delete ALL tasks
    console.log("\n📋 Step 3: Deleting all tasks...");
    const allTasks = await Task.find({});
    console.log(`⚠️  Found ${allTasks.length} tasks to delete`);

    if (allTasks.length > 0) {
      console.log("⚠️  WARNING: This will permanently delete ALL tasks!");
      console.log("Press Ctrl+C to cancel or wait 5 seconds to continue...");
      await new Promise(resolve => setTimeout(resolve, 5000));

      const taskIds = allTasks.map(t => t._id);

      // Delete tasks (this will trigger middleware to delete comments, responses, and activity logs)
      console.log("\n🗑️  Deleting tasks...");
      for (const task of allTasks) {
        await task.deleteOne(); // This triggers the pre-delete middleware
      }
      console.log(`✅ Deleted ${allTasks.length} tasks and related data`);

      // Additional cleanup for any orphaned data
      console.log("\n🧹 Cleaning up any remaining orphaned data...");
      
      const commentsDeleted = await Comment.deleteMany({ task: { $in: taskIds } });
      console.log(`   - Deleted ${commentsDeleted.deletedCount} orphaned comments`);
      
      const responsesDeleted = await Response.deleteMany({ task: { $in: taskIds } });
      console.log(`   - Deleted ${responsesDeleted.deletedCount} orphaned responses`);
      
      const activityLogsDeleted = await ActivityLog.deleteMany({ 
        $or: [
          { resourceId: { $in: taskIds } },
          { resourceType: "Task" }
        ]
      });
      console.log(`   - Deleted ${activityLogsDeleted.deletedCount} orphaned activity logs`);

      // Clean up task-related notifications
      const taskNotificationsDeleted = await Notification.deleteMany({
        "metadata.taskId": { $in: taskIds }
      });
      console.log(`   - Deleted ${taskNotificationsDeleted.deletedCount} task-related notifications`);
    } else {
      console.log("✅ No tasks to delete.");
    }

    // Step 4: Clean up workspaces and projects
    console.log("\n📋 Step 4: Cleaning up workspaces and projects...");
    
    const allProjects = await Project.find({});
    console.log(`   - Found ${allProjects.length} projects`);
    
    if (allProjects.length > 0) {
      for (const project of allProjects) {
        await project.deleteOne(); // This triggers middleware
      }
      console.log(`✅ Deleted ${allProjects.length} projects`);
    }

    const allWorkspaces = await Workspace.find({});
    console.log(`   - Found ${allWorkspaces.length} workspaces`);
    
    if (allWorkspaces.length > 0) {
      for (const workspace of allWorkspaces) {
        await workspace.deleteOne(); // This triggers middleware
      }
      console.log(`✅ Deleted ${allWorkspaces.length} workspaces`);
    }

    // Step 5: Summary
    console.log("\n" + "=".repeat(50));
    console.log("📊 CLEANUP SUMMARY");
    console.log("=".repeat(50));
    console.log(`✅ Users kept: ${usersToKeep.length}`);
    console.log(`🗑️  Users deleted: ${usersToDelete.length}`);
    console.log(`🗑️  Tasks deleted: ${allTasks.length}`);
    console.log(`🗑️  Projects deleted: ${allProjects.length}`);
    console.log(`🗑️  Workspaces deleted: ${allWorkspaces.length}`);
    console.log("=".repeat(50));
    console.log("\n✅ Database cleanup completed successfully!\n");

  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
    process.exit(0);
  }
}

// Run cleanup
cleanupDatabase();
