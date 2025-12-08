// seed.js (updated full)
// Save in project root and run: node seed.js

import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import User from "./DB/model/user.model.js";
import Post from "./DB/model/post.model.js";
import Reel from "./DB/model/reel.model.js";
import Story from "./DB/model/story.model.js";
import Chat from "./DB/model/chat.model.js";

// ---- CONFIG ----
const NUM_USERS = 200;
const MIN_FOLLOWING_PER_USER = 5;
const MAX_FOLLOWING_PER_USER = 15;

const MAX_POSTS_PER_USER = 10;
const MAX_REELS_PER_USER = 5;
const MAX_STORIES_PER_USER = 3;

const MAX_IMAGES_PER_POST = 3;
const MAX_COMMENTS_PER_POST = 10;
const MAX_REPLIES_PER_COMMENT = 3;

const BATCH = 20;
const BULK_CHUNK = 50;

// ---- notification labels ----
const notification = {
  comment: 'Comment on your post',
  like: 'Like your post',
  follow: 'Started following you',
  message: 'new message from',
  suggest: 'who you might know, is on instagram',
  addStory: 'added new story',
  addPost: 'added new post',
};

// ---- helpers ----
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const pickMany = (arr, n) => shuffle(arr).slice(0, Math.min(n, arr.length));
const sample = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Sample data
const firstNames = [
  "Mohamed","Ahmed","Youssef","Sara","Mona","Omar","Aya","Kareem","Laila","Hassan",
  "Salma","Mustafa","Ziad","Dina","Rania","Noor","Yara","Amr","Tala","Farah",
  "Huda","Samir","Jana","Malak","Habiba","Nourhan","Mariam","Reem","Hager","Esraa",
  "Basma","Rawan","Nadine","Jude","Hala","Shahd","Doha","Nour","Fares","Badr",
  "Adham","Tamer","Walid","Seif","Othman","Ola","Rokaia","Kholoud","Rahma","Somaya",
  "Youssef","Malek","Joud","Aseel","Ritaj","Yazan","Anas","Yamen","Kinan","Yahya",
  "John","David","Michael","Chris","Daniel","Sophia","Emma","Olivia","Isabella","Mia",
  "Ethan","Liam","Noah","James","Aiden","Ava","Chloe","Ella","Grace","Luna"
];
const lastNames = [
  "Ali","Hassan","Kamel","Saeed","Ibrahim","Hamada","Farag","Hussein","Abdelrahman","Nader",
  "Osman","Sami","Yunis","Sultan","Mahmoud","Abdullah","Soliman","Mansour","Khalil","Shawky",
  "Mostafa","Bakr","Fouad","Saad","Gamal","Nassef","Rashwan","Yacoub","Shenouda","Gerges",
  "Connor","Smith","Johnson","Williams","Brown","Jones","Miller","Davis","Garcia","Martinez",
  "Robinson","Clark","Rodriguez","Lewis","Walker","Hall","Allen","Young","King","Wright"
];
const sampleComments = [
  "جميل جدا!","روعة 👍","مبهر","بحب الكومبوزيشن هنا","محتوى قيم",
  "متى التقاط هذه الصورة؟","حلو!","مُلهِم","تسلم إيدك","الله يفتحها عليك",
  "شكل المكان رهيب","ايه الجمال ده","انا بحب ستايل تصويرك","كادر ممتاز 🔥",
  "إبداع كالعادة","يا سلام على التفاصيل","الصورة دي تشرح القلب","متحمس أشوف المزيد",
  "Perfect shot!","Amazing vibe","Love this!","So aesthetic","Beautiful",
  "Nice angle","Great lighting","What a moment","Insane quality","Soft colors, love it!"
];
const sampleReplies = [
  "تمام","فعلاً","شكراً لك","🙂","😂","بالضبط","متفق","ربي يسعدك",
  "تسلم","شكراً على رأيك 🙏","موافقك","هايل","أيوه فعلاً","هحاول أطور أكتر"
];
const sampleCaptions = [
  "Lovely!","Check this out","My new shot","On my way","Memories",
  "Behind the scene","Another day, another story","Feeling the vibe",
  "Living the moment","Captured with love","Random click","New beginnings",
  "Chasing sunsets","Mood of the day","Keep going","Small moments matter",
  "Life in colors","Stay positive","Explore more","Dream big","Simple things",
  "Love this view","Personal favorite","Unfiltered moment","Daily dose of joy",
  "Trying something new","Throwback vibes","Can't get enough of this","Art in motion"
];
const sampleStoryTexts = [
  "Lovely!","Check this out","My new shot","On my way","Memories",
  "Behind the scene","Another day, another story","Feeling the vibe",
  "Living the moment","Captured with love","Random click","New beginnings",
  "Chasing sunsets","Mood of the day","Keep going","Small moments matter",
  "Life in colors","Stay positive","Explore more","Dream big","Simple things",
  "Love this view","Personal favorite","Unfiltered moment","Daily dose of joy",
  "Trying something new","Throwback vibes","Can't get enough of this","Art in motion"
];
const avatarUrl = (id) => `https://i.pravatar.cc/300?img=${(id % 70) + 1}`;
const randomImage = () => `https://picsum.photos/seed/${Math.random().toString(36).slice(2,9)}/800/800`;

// Short video pool (5-10s-ish or small test clips)
const shortVideos = [
  "https://samplelib.com/lib/preview/mp4/sample-5s.mp4",
  "https://samplelib.com/lib/preview/mp4/sample-10s.mp4",
  "https://samplelib.com/lib/preview/mp4/sample-15s.mp4",
  "https://samplelib.com/lib/preview/mp4/sample-20s.mp4",
  "https://samplelib.com/lib/preview/mp4/sample-30s.mp4",
  
  "https://samplelib.com/lib/preview/mp4/sample-5s.mp4?1",
  "https://samplelib.com/lib/preview/mp4/sample-10s.mp4?1",
  "https://samplelib.com/lib/preview/mp4/sample-15s.mp4?1",
  "https://samplelib.com/lib/preview/mp4/sample-20s.mp4?1",
  "https://samplelib.com/lib/preview/mp4/sample-30s.mp4?1",

  "https://samplelib.com/lib/preview/mp4/sample-5s.mp4?2",
  "https://samplelib.com/lib/preview/mp4/sample-10s.mp4?2",
  "https://samplelib.com/lib/preview/mp4/sample-15s.mp4?2",
  "https://samplelib.com/lib/preview/mp4/sample-20s.mp4?2",
  "https://samplelib.com/lib/preview/mp4/sample-30s.mp4?2",

  "https://samplelib.com/lib/preview/mp4/sample-5s.mp4?3",
  "https://samplelib.com/lib/preview/mp4/sample-10s.mp4?3",
  "https://samplelib.com/lib/preview/mp4/sample-15s.mp4?3",
  "https://samplelib.com/lib/preview/mp4/sample-20s.mp4?3",
  "https://samplelib.com/lib/preview/mp4/sample-30s.mp4?3",

  "https://samplelib.com/lib/preview/mp4/sample-5s.mp4?4",
  "https://samplelib.com/lib/preview/mp4/sample-10s.mp4?4",
  "https://samplelib.com/lib/preview/mp4/sample-15s.mp4?4",
  "https://samplelib.com/lib/preview/mp4/sample-20s.mp4?4",
  "https://samplelib.com/lib/preview/mp4/sample-30s.mp4?4",

  "https://samplelib.com/lib/preview/mp4/sample-5s.mp4?5",
  "https://samplelib.com/lib/preview/mp4/sample-10s.mp4?5",
  "https://samplelib.com/lib/preview/mp4/sample-15s.mp4?5",
  "https://samplelib.com/lib/preview/mp4/sample-20s.mp4?5",
  "https://samplelib.com/lib/preview/mp4/sample-30s.mp4?5"
];