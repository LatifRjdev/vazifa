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
import Verification from "./models/verification.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/vazifa";

// Specific users to delete by email
const EMAILS_TO_DELETE = [
  "bahrom2003@mail.ru",
  "meteba7279@aiwanlab.com",
  "timofo3884@etramay.com",
  "newadmin@vazifa.com",
  "wawek25283@fermiro.com",
  "sabewi9230@aiwanlab.com"
];

async function cleanupSpecificUsers() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Get today's date at midnight (Asia/Dushanbe timezone UTC+5)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log(`📅 Today's date (start): ${today.toISOString()}`);
    console.log(`📅 Current time: ${new Date().toISOString()}\n`);

    // Step 1: Find and delete specific users
    console.log("📋 Step 1: Identifying users to delete...");
    console.log("Looking for users with these emails:");
    EMAILS_TO_DELETE.forEach(email => console.log(`   - ${email}`));
    console.log();

    const usersToDelete = await User.find({
      email: { $in: EMAILS_TO_DELETE }
    });

    console.log(`⚠️  Found ${usersToDelete.length} users to delete:`);
    usersToDelete.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - Role: ${user.role}`);
    });

    if (usersToDelete.length === 0) {
      console.log("✅ No users found to delete.\n");
    } else {
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

      // Transfer workspace ownership to first available admin if owner was deleted
      console.log("\n🔄 Checking workspace ownership...");
      const workspacesNeedingOwner = await Workspace.find({
        owner: { $in: userIdsToDelete }
      });
      
      if (workspacesNeedingOwner.length > 0) {
        const firstAdmin = await User.findOne({
          role: { $in: ["admin", "super_admin"] }
        });
        
        if (firstAdmin) {
          for (const workspace of workspacesNeedingOwner) {
            workspace.owner = firstAdmin._id;
            await workspace.save();
            console.log(`   - Transferred ownership of "${workspace.name}" to ${firstAdmin.name}`);
          }
        } else {
          console.log("⚠️  No admin found to transfer workspace ownership!");
        }
      } else {
        console.log("✅ No workspaces need ownership transfer");
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

    // Step 2: Delete tasks created BEFORE today
    console.log("\n📋 Step 2: Identifying tasks to delete (created before today)...");
    const oldTasks = await Task.find({
      createdAt: { $lt: today }
    });
    
    console.log(`⚠️  Found ${oldTasks.length} old tasks to delete`);

    // Check tasks created today
    const todayTasks = await Task.find({
      createdAt: { $gte: today }
    });
    console.log(`✅ Found ${todayTasks.length} tasks created today (will be preserved)`);

    if (oldTasks.length > 0) {
      console.log("\n⚠️  WARNING: This will permanently delete old tasks!");
      console.log("Press Ctrl+C to cancel or wait 5 seconds to continue...");
      await new Promise(resolve => setTimeout(resolve, 5000));

      const oldTaskIds = oldTasks.map(t => t._id);

      // Delete old tasks (this will trigger middleware to delete comments, responses, and activity logs)
      console.log("\n🗑️  Deleting old tasks...");
      let deletedTaskCount = 0;
      for (const task of oldTasks) {
        await task.deleteOne(); // This triggers the pre-delete middleware
        deletedTaskCount++;
      }
      console.log(`✅ Deleted ${deletedTaskCount} old tasks and related data`);

      // Additional cleanup for any orphaned data
      console.log("\n🧹 Cleaning up any remaining orphaned data...");
      
      const commentsDeleted = await Comment.deleteMany({ task: { $in: oldTaskIds } });
      console.log(`   - Deleted ${commentsDeleted.deletedCount} orphaned comments`);
      
      const responsesDeleted = await Response.deleteMany({ task: { $in: oldTaskIds } });
      console.log(`   - Deleted ${responsesDeleted.deletedCount} orphaned responses`);
      
      const activityLogsDeleted = await ActivityLog.deleteMany({ 
        $or: [
          { resourceId: { $in: oldTaskIds } },
          { resourceType: "Task", createdAt: { $lt: today } }
        ]
      });
      console.log(`   - Deleted ${activityLogsDeleted.deletedCount} orphaned activity logs`);

      // Clean up old task-related notifications
      const taskNotificationsDeleted = await Notification.deleteMany({
        "metadata.taskId": { $in: oldTaskIds }
      });
      console.log(`   - Deleted ${taskNotificationsDeleted.deletedCount} old task-related notifications`);
    } else {
      console.log("✅ No old tasks to delete.");
    }

    // Step 3: Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 CLEANUP SUMMARY");
    console.log("=".repeat(60));
    console.log(`🗑️  Users deleted: ${usersToDelete.length}`);
    console.log(`🗑️  Old tasks deleted (before today): ${oldTasks.length}`);
    console.log(`✅ Tasks preserved (created today): ${todayTasks.length}`);
    console.log(`📅 Today's date cutoff: ${today.toISOString()}`);
    console.log("=".repeat(60));
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
cleanupSpecificUsers();
