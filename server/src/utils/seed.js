require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");
const User = require("../models/User");
const Interest = require("../models/Interest");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Notification = require("../models/Notification");
const Report = require("../models/Report");

// Demo-only headshots (public sample photos) so seeded profiles look like a
// real product screenshot instead of cartoon avatars. Real user accounts
// never get one of these — they must upload their own photo at registration.
const SAMPLE_USERS = [
  {
    name: "Ahmad Khan", email: "ahmad@example.com", gender: "male",
    dob: "1995-03-12", sect: "Sunni", country: "India", city: "Mumbai",
    education: "Master's", profession: "Software Engineer", maritalStatus: "Never married",
    bio: "Practising Muslim, software engineer based in Mumbai. Looking for a partner who shares similar deen and values.",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    name: "Fatima Ali", email: "fatima@example.com", gender: "female",
    dob: "1997-07-22", sect: "Sunni", country: "India", city: "Delhi",
    education: "Bachelor's", profession: "Teacher", maritalStatus: "Never married",
    bio: "Teacher who loves reading and volunteering. Seeking a kind, practising partner for marriage.",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    name: "Yusuf Rahman", email: "yusuf@example.com", gender: "male",
    dob: "1992-11-05", sect: "Sunni", country: "Pakistan", city: "Lahore",
    education: "PhD", profession: "Doctor", maritalStatus: "Never married",
    bio: "Physician with a passion for community service. Family-oriented and looking for a serious match.",
    avatar: "https://randomuser.me/api/portraits/men/65.jpg",
  },
  {
    name: "Aisha Siddiqui", email: "aisha@example.com", gender: "female",
    dob: "1998-01-18", sect: "Shia", country: "UK", city: "London",
    education: "Master's", profession: "Architect", maritalStatus: "Never married",
    bio: "Architect living in London, passionate about design and travel. Looking for a respectful, modern-minded partner.",
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
    galleryPrivacy: "public",
  },
  {
    name: "Omar Farooq", email: "omar@example.com", gender: "male",
    dob: "1990-05-30", sect: "Sunni", country: "UAE", city: "Dubai",
    education: "Bachelor's", profession: "Business Owner", maritalStatus: "Divorced",
    bio: "Entrepreneur, father of one, looking for a caring partner to build a halal home together.",
    avatar: "https://randomuser.me/api/portraits/men/12.jpg",
  },
  {
    name: "Maryam Hassan", email: "maryam@example.com", gender: "female",
    dob: "1996-09-14", sect: "Sunni", country: "Canada", city: "Toronto",
    education: "Professional (MBBS/LLB/etc)", profession: "Lawyer", maritalStatus: "Never married",
    bio: "Lawyer based in Toronto, practising Muslimah who values family and faith above all.",
    avatar: "https://randomuser.me/api/portraits/women/21.jpg",
  },
];

const PASSWORD = "password123";

async function seed() {
  await connectDB();

  console.log("Clearing existing data...");
  await Promise.all([
    User.deleteMany({}), Interest.deleteMany({}), Conversation.deleteMany({}),
    Message.deleteMany({}), Notification.deleteMany({}), Report.deleteMany({}),
  ]);

  console.log("Creating users...");
  const hashed = await bcrypt.hash(PASSWORD, 10);
  const created = [];
  for (const u of SAMPLE_USERS) {
    const user = await User.create({
      ...u,
      password: hashed,
      profileCompletion: 80,
      verified: true,
      avatarPrivacy: "public",
      galleryPrivacy: u.galleryPrivacy || "connections",
      partnerPrefs: { ageMin: 22, ageMax: 38, sect: "Any", country: "Any", education: "Any", maritalStatus: "Any" },
    });
    created.push(user);
  }

  console.log("Creating a sample interest + conversation...");
  const [ahmad, fatima] = created;
  await Interest.create({ from: ahmad._id, to: fatima._id, status: "pending", message: "Assalamu Alaikum, I'd like to connect." });

  const conversation = await Conversation.create({
    participants: [ahmad._id, fatima._id],
    lastMessage: "Looking forward to hearing from your family.",
    lastMessageAt: new Date(),
  });

  await Message.insertMany([
    { conversation: conversation._id, sender: ahmad._id, text: "Assalamu Alaikum, I hope you're well.", readBy: [ahmad._id, fatima._id] },
    { conversation: conversation._id, sender: fatima._id, text: "Walaikum Assalam, thank you for reaching out.", readBy: [ahmad._id, fatima._id] },
    { conversation: conversation._id, sender: ahmad._id, text: "Looking forward to hearing from your family.", readBy: [ahmad._id] },
  ]);

  await Notification.create({
    user: fatima._id,
    type: "interest_received",
    fromUser: ahmad._id,
    text: `${ahmad.name} sent you an interest.`,
    link: `/profile/${ahmad._id}`,
  });

  console.log("\nSeed complete!");
  console.log(`Sample login -> email: ${SAMPLE_USERS[0].email}  password: ${PASSWORD}`);
  console.log(`Sample login -> email: ${SAMPLE_USERS[1].email}  password: ${PASSWORD}`);
  await mongoose.connection.close();
  process.exit(0);
}

seed().catch(err => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
