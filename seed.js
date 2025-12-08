// seed.js — complete seed script
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

// عدّل المسارات إن موديلاتك في مكان مختلف
import User from "./DB/model/user.model.js";
import Post from "./DB/model/post.model.js";
import Reel from "./DB/model/reel.model.js";
import Story from "./DB/model/story.model.js";
import Chat from "./DB/model/chat.model.js";

// ---------------- CONFIG ----------------
const NUM_USERS = 200; // غيّره للتجربة (مثلاً 20)
const MIN_FOLLOWING_PER_USER = 5;
const MAX_FOLLOWING_PER_USER = 20;

const MAX_POSTS_PER_USER = 5;
const MAX_REELS_PER_USER = 3;
const MAX_STORIES_PER_USER = 3;

const MAX_IMAGES_PER_POST = 4;
const MAX_COMMENTS_PER_POST = 15;
const MAX_REPLIES_PER_COMMENT = 5;

const BATCH = 20;
const BULK_CHUNK = 50;

// ---------------- notification labels ----------------
const notification = {
  comment: 'Comment on your post',
  like: 'Like your post',
  follow: 'Started following you',
  message: 'new message from',
  suggest: 'who you might know, is on instagram',
  addStory: 'added new story',
  addPost: 'added new post',
};

// ---------------- helpers & pools ----------------
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

// expanded pools
const firstNames = [
  "Mohamed","Ahmed","Youssef","Sara","Mona","Omar","Aya","Kareem","Laila","Hassan",
  "Salma","Mustafa","Ziad","Dina","Rania","Noor","Yara","Amr","Tala","Farah",
  "Huda","Samir","Jana","Malak","Habiba","Nourhan","Mariam","Reem","Hager","Esraa",
  "Basma","Rawan","Nadine","Jude","Hala","Shahd","Doha","Nour","Fares","Badr",
  "Adham","Tamer","Walid","Seif","Othman","Ola","Rokaia","Kholoud","Rahma","Somaya",
  "Malek","Joud","Aseel","Ritaj","Yazan","Anas","Yamen","Kinan","Yahya",
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

const sampleStoryTexts = ["صباح الخير", "تفكيري اليوم", "ملخص الرحلة", "معلومة سريعة", "صورة من قلبي", "لحظة صغيرة"];

const avatarUrl = (id) => `https://i.pravatar.cc/300?img=${(id % 70) + 1}`;
const randomImage = () => `https://picsum.photos/seed/${Math.random().toString(36).slice(2,9)}/800/800`;

// short reliable video pool (small clips)
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
const randomVideo = () => sample(shortVideos);

// ---------------- MAIN FLOW ----------------
const runSeed = async () => {
  try {
    const MONGO_URI = process.env.DBURL || "mongodb+srv://ziad:00241300@cluster0.bxnbg.mongodb.net/instagram";
    console.log("Using MONGO_URI =", MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Uncomment if you want to wipe DB first (USE WITH CAUTION)
    await User.deleteMany({});
    await Post.deleteMany({});
    await Reel.deleteMany({});
    await Story.deleteMany({});
    await Chat.deleteMany({});

    // 1) generate users
    const usersData = [];
    for (let i = 0; i < NUM_USERS; i++) {
      const fn = sample(firstNames);
      const ln = sample(lastNames);
      const userName = `${fn.toLowerCase()}${ln.toLowerCase()}${randomInt(1,999)}`;
      const fullName = `${fn} ${ln}`;
      const email = `${userName}${randomInt(1,9999)}@gmail.com`;
      usersData.push({
        userName,
        fullName,
        email,
        password: "admin",
        phone: `01${randomInt(100000000, 999999999)}`,
        bio: sample(["Hello world", "Love coding", "Traveler", "Photographer", "Designer", "Foodie", "Music lover"]),
        profilePic: avatarUrl(i+1),
      });
    }

    // 2) create users (pre-save runs hashing)
    console.log("Creating users...");
    const createdUsers = [];
    for (let i = 0; i < usersData.length; i += BATCH) {
      const batch = usersData.slice(i, i + BATCH);
      const created = await Promise.all(batch.map(u => User.create(u)));
      createdUsers.push(...created);
      console.log(`Created users: ${createdUsers.length}/${NUM_USERS}`);
    }

    // prepare maps
    const userIds = createdUsers.map(u => u._id.toString());
    const followersMap = new Map();
    const followingMap = new Map();
    const savedPostsMap = new Map(); // userId -> Set(postId)
    const savedReelsMap = new Map(); // userId -> Set(reelId)
    const notificationsMap = new Map(); // userId -> Array of notifications
    for (const id of userIds) {
      followersMap.set(id, new Set());
      followingMap.set(id, new Set());
      savedPostsMap.set(id, new Set());
      savedReelsMap.set(id, new Set());
      notificationsMap.set(id, []);
    }

    // 3) generate following/followers + follow notifications
    console.log("Generating follow relations + notifications...");
    for (const uid of userIds) {
      const numFollow = randomInt(MIN_FOLLOWING_PER_USER, MAX_FOLLOWING_PER_USER);
      const possible = userIds.filter(id => id !== uid);
      const chosen = pickMany(possible, numFollow);
      for (const fo of chosen) {
        followingMap.get(uid).add(fo);
        followersMap.get(fo).add(uid);
        // add follow notification to fo
        const followerUser = createdUsers.find(u => u._id.toString() === uid);
        notificationsMap.get(fo).push({
          text: `${followerUser.userName} ${notification.follow}`,
          seen: false,
          type: "follow",
          data: followerUser._id,
          redirect: `${followerUser._id}`,
          createdAt: new Date()
        });
      }
    }

    // persist follow relations
    console.log("Persisting follow relations...");
    const bulkFollowOps = [];
    for (const user of createdUsers) {
      const id = user._id.toString();
      bulkFollowOps.push({
        updateOne: {
          filter: { _id: user._id },
          update: {
            $set: {
              following: Array.from(followingMap.get(id)),
              followers: Array.from(followersMap.get(id))
            }
          }
        }
      });
    }
    for (let i = 0; i < bulkFollowOps.length; i += BULK_CHUNK) {
      await User.bulkWrite(bulkFollowOps.slice(i, i + BULK_CHUNK));
    }
    console.log("Followers/Following persisted.");

    // 4) create posts and optionally add to savedPostsMap + notifications
    console.log("Creating posts...");
    const createdPosts = [];
    for (const user of createdUsers) {
      const numPosts = randomInt(0, MAX_POSTS_PER_USER);
      for (let p = 0; p < numPosts; p++) {
        const media = [];
        const numMedia = randomInt(1, MAX_IMAGES_PER_POST);
        for (let m = 0; m < numMedia; m++) {
          media.push({
            url: randomImage(),
            public_id: `post_${user._id}_${p}_${m}_${Date.now()}`,
            type: "image"
          });
        }

        const likes = pickMany(userIds.filter(id => id !== user._id.toString()), randomInt(0, 30));
        // like notifications for owner
        likes.forEach(likerId => {
          notificationsMap.get(user._id.toString()).push({
            text: `${createdUsers.find(u => u._id.toString() === likerId).userName} ${notification.like}`,
            seen: false,
            type: "like",
            data: likerId,
            redirect: `/post/`,
            createdAt: new Date()
          });
        });

        const comments = [];
        const numComments = randomInt(0, MAX_COMMENTS_PER_POST);
        for (let c = 0; c < numComments; c++) {
          const commenterId = sample(userIds.filter(id => id !== user._id.toString()));
          const replies = [];
          const numReplies = randomInt(0, MAX_REPLIES_PER_COMMENT);
          for (let r = 0; r < numReplies; r++) {
            const replierId = sample(userIds.filter(id => id !== commenterId));
            replies.push({
              userId: replierId,
              reply: sample(sampleReplies),
              hide: false
            });
          }
          // comment notification to post owner
          notificationsMap.get(user._id.toString()).push({
            text: `${createdUsers.find(u => u._id.toString() === commenterId).userName} ${notification.comment}`,
            seen: false,
            type: "comment",
            data: commenterId,
            redirect: `/post/`,
            createdAt: new Date()
          });

          comments.push({
            userId: commenterId,
            comment: sample(sampleComments),
            replies
          });
        }

        const newPost = await Post.create({
          caption: sample(sampleCaptions),
          postsImgAndVideos: media,
          createdBy: user._id,
          tags: pickMany(userIds.filter(id => id !== user._id.toString()), randomInt(0,3)),
          likes,
          comments
        });

        // fix like/comment notifications redirect to include post id
        const ownerNotifs = notificationsMap.get(user._id.toString());
        for (const nf of ownerNotifs) {
          if ((nf.type === "like" || nf.type === "comment") && (!nf.redirect || nf.redirect === `/post/`)) {
            nf.redirect = `/post/${newPost._id}`;
          }
        }

        // randomly add this post to some users' savedPosts
        const willBeSavedByCount = randomInt(0, Math.min(5, userIds.length - 1));
        const savers = pickMany(userIds.filter(id => id !== user._id.toString()), willBeSavedByCount);
        for (const saverId of savers) {
          savedPostsMap.get(saverId).add(newPost._id.toString());
        }

        createdPosts.push(newPost);
      }
    }
    console.log(`Created posts: ${createdPosts.length}`);

    // 5) create reels (each with different short video), savedReels and notifications
    console.log("Creating reels...");
    const createdReels = [];
    for (const user of createdUsers) {
      const numReels = randomInt(0, MAX_REELS_PER_USER);
      for (let r = 0; r < numReels; r++) {
        const videoUrl = randomVideo();
        const likes = pickMany(userIds.filter(id => id !== user._id.toString()), randomInt(0, 20));
        likes.forEach(likerId => {
          notificationsMap.get(user._id.toString()).push({
            text: `${createdUsers.find(u => u._id.toString() === likerId).userName} ${notification.like}`,
            seen: false,
            type: "like",
            data: likerId,
            redirect: `/reel/`,
            createdAt: new Date()
          });
        });

        const newReel = await Reel.create({
          caption: sample(["Short clip", "Watch till end", "Funny moment", "Reel time", "Creative cut"]),
          public_id: `reel_${user._id}_${r}_${Date.now()}`,
          url: videoUrl,
          createdBy: user._id,
          tags: pickMany(userIds.filter(id => id !== user._id.toString()), randomInt(0,2)),
          likes,
          comments: []
        });

        // update like notifications redirect for this reel
        const ownerNotifsR = notificationsMap.get(user._id.toString());
        for (const nf of ownerNotifsR) {
          if (nf.type === "like" && (!nf.redirect || nf.redirect === `/reel/`)) {
            nf.redirect = `/reel/${newReel._id}`;
          }
        }

        // randomly add this reel to some users' savedReels
        const willBeSavedByCount = randomInt(0, Math.min(5, userIds.length - 1));
        const savers = pickMany(userIds.filter(id => id !== user._id.toString()), willBeSavedByCount);
        for (const saverId of savers) {
          savedReelsMap.get(saverId).add(newReel._id.toString());
        }

        createdReels.push(newReel);
      }
    }
    console.log(`Created reels: ${createdReels.length}`);

    // 6) create stories (0-3 per user) and notify followers
    console.log("Creating stories...");
    const createdStories = [];
    for (const user of createdUsers) {
      const numStories = randomInt(0, MAX_STORIES_PER_USER);
      for (let s = 0; s < numStories; s++) {
        const type = sample(["image", "video", "text"]);
        const storyData = {
          caption: type === "text" ? sample(sampleStoryTexts) : "",
          duration: 10,
          public_id: `story_${user._id}_${s}_${Date.now()}`,
          url: type === "image" ? randomImage() : (type === "video" ? randomVideo() : ""),
          createdBy: user._id,
          viewer: [],
          likes: [],
          type
        };
        const newStory = await Story.create(storyData);
        createdStories.push(newStory);

        // notify followers about new story
        const followers = Array.from(followersMap.get(user._id.toString()) || []);
        followers.forEach(fId => {
          notificationsMap.get(fId).push({
            text: `${user.userName} ${notification.addStory}`,
            seen: false,
            type: "addStory",
            data: user._id,
            redirect: `/story/${newStory._id}`,
            createdAt: new Date()
          });
        });
      }
    }
    console.log(`Created stories: ${createdStories.length}`);

    // 7) create chats — unique pairs, max 3 chats per user, save chat ids to users.chats
    console.log("Creating chats (unique pairs, max 3 chats per user)...");
    const createdChats = [];
    const chatsMap = new Map(); // userId -> Set(chatId)
    const chatsCountMap = new Map(); // userId -> count
    for (const id of userIds) {
      chatsMap.set(id, new Set());
      chatsCountMap.set(id, 0);
    }
    const pairSet = new Set();
    const TARGET_CHATS = Math.floor(NUM_USERS * 0.3);
    const MAX_ATTEMPTS = TARGET_CHATS * 12;
    let attempts = 0;

    while (createdChats.length < TARGET_CHATS && attempts < MAX_ATTEMPTS) {
      attempts++;
      // pick 2 distinct users
      const [a, b] = pickMany(userIds, 2);
      if (!a || !b || a === b) continue;
      if (chatsCountMap.get(a) >= 3 || chatsCountMap.get(b) >= 3) continue;
      const key = a < b ? `${a}_${b}` : `${b}_${a}`;
      if (pairSet.has(key)) continue;

      // build messages
      const numMessages = randomInt(3, 12);
      const messages = [];
      for (let m = 0; m < numMessages; m++) {
        const sender = sample([a, b]);
        const textOnly = sample(["hi", "hello", "كيف الحال؟", "تمام", "شغال؟", sampleComments[Math.floor(Math.random()*sampleComments.length)]]);
        const hasImage = Math.random() < 0.1;
        messages.push({
          message: textOnly,
          images: hasImage ? [randomImage()] : [],
          date: new Date().toLocaleDateString("en"),
          time: new Date().toLocaleTimeString("en-US", { hour12: true }),
          sender
        });

        // notify the other participant (temporary redirect)
        const other = sender === a ? b : a;
        notificationsMap.get(other).push({
          text: `${createdUsers.find(u => u._id.toString() === sender).userName} ${notification.message}`,
          seen: false,
          type: "message",
          data: sender,
          redirect: `/chat/temp_${createdChats.length}`, // will update after create
          createdAt: new Date()
        });
      }

      const newChat = await Chat.create({
        userIds: [a, b],
        messages,
        type: "chat"
      });

      // mark pair used and update maps
      pairSet.add(key);
      createdChats.push(newChat);
      chatsMap.get(a).add(newChat._id.toString());
      chatsMap.get(b).add(newChat._id.toString());
      chatsCountMap.set(a, chatsCountMap.get(a) + 1);
      chatsCountMap.set(b, chatsCountMap.get(b) + 1);

      // update temp redirects in notifications to real chat id
      for (const uid of [a, b]) {
        const arr = notificationsMap.get(uid);
        for (const nf of arr) {
          if (nf.type === "message" && nf.redirect === `/chat/temp_${createdChats.length - 1}`) {
            nf.redirect = `/chat/${newChat._id}`;
          }
        }
      }
    }

    console.log(`Created chats: ${createdChats.length} (attempts: ${attempts})`);

    // persist chat ids into users.chats
    console.log("Persisting chat ids into users.chats ...");
    const chatBulkOps = [];
    for (const user of createdUsers) {
      const uid = user._id.toString();
      chatBulkOps.push({
        updateOne: {
          filter: { _id: user._id },
          update: {
            $set: { chats: Array.from(chatsMap.get(uid) || []) }
          }
        }
      });
    }
    for (let i = 0; i < chatBulkOps.length; i += BULK_CHUNK) {
      await User.bulkWrite(chatBulkOps.slice(i, i + BULK_CHUNK));
    }
    console.log("Users.chats updated with chat ids.");

    // 8) persist savedPosts and savedReels into users
    console.log("Persisting savedPosts and savedReels into users...");
    const userSaveBulk = [];
    for (const user of createdUsers) {
      const id = user._id.toString();
      userSaveBulk.push({
        updateOne: {
          filter: { _id: user._id },
          update: {
            $set: {
              savedPosts: Array.from(savedPostsMap.get(id)),
              savedReels: Array.from(savedReelsMap.get(id))
            }
          }
        }
      });
    }
    for (let i = 0; i < userSaveBulk.length; i += BULK_CHUNK) {
      await User.bulkWrite(userSaveBulk.slice(i, i + BULK_CHUNK));
    }
    console.log("Saved posts/reels persisted to users.");

    // 9) create collections for each user from their saved arrays
    console.log("Creating collections from saved items...");
    const collectionsByUser = new Map();
    for (const user of createdUsers) {
      const id = user._id.toString();
      const savedPostsArr = Array.from(savedPostsMap.get(id));
      const savedReelsArr = Array.from(savedReelsMap.get(id));

      const numCollections = randomInt(0, 3);
      const collections = [];
      for (let c = 0; c < numCollections; c++) {
        const pickType = sample(["posts", "reels"]);
        let items = [];
        if (pickType === "posts" && savedPostsArr.length) {
          items = pickMany(savedPostsArr, randomInt(1, Math.min(6, savedPostsArr.length)));
        } else if (pickType === "reels" && savedReelsArr.length) {
          items = pickMany(savedReelsArr, randomInt(1, Math.min(6, savedReelsArr.length)));
        } else {
          if (savedPostsArr.length) items = pickMany(savedPostsArr, randomInt(1, Math.min(6, savedPostsArr.length)));
          else if (savedReelsArr.length) items = pickMany(savedReelsArr, randomInt(1, Math.min(6, savedReelsArr.length)));
        }
        if (items.length) {
          collections.push({
            collectionName: `My collection ${c+1}`,
            saved: items
          });
        }
      }
      collectionsByUser.set(id, collections);
    }

    // 10) persist collections + notifications + link posts/reels/stories to users
    console.log("Persisting collections, notifications and linking posts/reels/stories to users...");
    // gather posts/reels/stories by user
    const postsByUser = new Map();
    for (const p of createdPosts) {
      const uid = p.createdBy.toString();
      if (!postsByUser.has(uid)) postsByUser.set(uid, []);
      postsByUser.get(uid).push(p._id);
    }
    const reelsByUser = new Map();
    for (const r of createdReels) {
      const uid = r.createdBy.toString();
      if (!reelsByUser.has(uid)) reelsByUser.set(uid, []);
      reelsByUser.get(uid).push(r._id);
    }
    const storiesByUser = new Map();
    for (const s of createdStories) {
      const uid = s.createdBy.toString();
      if (!storiesByUser.has(uid)) storiesByUser.set(uid, []);
      storiesByUser.get(uid).push(s._id);
    }

    const userUpdateOps = [];
    for (const user of createdUsers) {
      const id = user._id.toString();
      userUpdateOps.push({
        updateOne: {
          filter: { _id: user._id },
          update: {
            $set: {
              collections: collectionsByUser.get(id) || [],
              notifications: notificationsMap.get(id) || [],
              posts: postsByUser.get(id) || [],
              reels: reelsByUser.get(id) || [],
              stories: storiesByUser.get(id) || []
            }
          }
        }
      });
    }
    for (let i = 0; i < userUpdateOps.length; i += BULK_CHUNK) {
      await User.bulkWrite(userUpdateOps.slice(i, i + BULK_CHUNK));
    }

    console.log("Collections, notifications and links persisted to users.");

    console.log("Seed finished successfully!");
    console.log(`Users: ${createdUsers.length}, Posts: ${createdPosts.length}, Reels: ${createdReels.length}, Stories: ${createdStories.length}, Chats: ${createdChats.length}`);

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    try { await mongoose.disconnect(); } catch (e) {}
    process.exit(1);
  }
};

runSeed();
