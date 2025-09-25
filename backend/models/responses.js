import mongoose, { Schema } from "mongoose";

const responseSchema = new Schema(
  {
    text: {
      type: String,
      trim: true,
    },
    task: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    attachments: [
      {
        fileName: {
          type: String,
        },
        fileUrl: {
          type: String,
        },
        fileType: {
          type: String,
        },
        fileSize: {
          type: Number,
        },
      },
    ],
    isEdited: {
      type: Boolean,
      default: false,
    },
    // Поле для отслеживания того, что это ответ участника на задачу
    isResponse: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Response = mongoose.model("Response", responseSchema);

export default Response;
