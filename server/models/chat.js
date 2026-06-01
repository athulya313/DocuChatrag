import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  role: String,
  text: String,
  sources: Array,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const chatSchema = new mongoose.Schema({
  sessionId: String,
  title: String,
  messages: [messageSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Chat = mongoose.model("Chat", chatSchema);

export default Chat;