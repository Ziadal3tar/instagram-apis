import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dns from 'node:dns';
import 'dotenv/config';

import User from '../src/database/models/user.model.js';
import Post from '../src/database/models/post.model.js';
import Reel from '../src/database/models/reel.model.js';
import Story from '../src/database/models/story.model.js';
import Chat from '../src/database/models/chat.model.js';

/*
 * Expanded development seed for the current User/Post/Reel/Story/Chat schemas.
 * This seed is intentionally destructive: it replaces the contents of these
 * five collections. It will not run unless SEED_CLEAR_DATABASE=true is set.
 */

const MONGO_URI = 'mongodb+srv://ZiadAlmorsy:00241300@cluster0.mjwgrkh.mongodb.net/instagram';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'Demo12345!';
const USERNAME_LOWERCASE = true;

const USERS_DATA = [
  { userName: 'demo_user', fullName: 'Demo User', email: 'demo@instagram.local', profilePic: 'https://i.pravatar.cc/300?img=12', bio: 'Demo account for testing the Instagram-style social app.' },
  { userName: 'ahmed_dev', fullName: 'Ahmed Mohamed', email: 'ahmed@example.com', profilePic: 'https://i.pravatar.cc/300?img=11', bio: 'Full-stack developer | JavaScript, Node.js and coffee.' },
  { userName: 'sara_design', fullName: 'Sara Hassan', email: 'sara@example.com', profilePic: 'https://i.pravatar.cc/300?img=5', bio: 'UI/UX designer making useful things feel simple.' },
  { userName: 'omar_codes', fullName: 'Omar Ali', email: 'omar@example.com', profilePic: 'https://i.pravatar.cc/300?img=13', bio: 'Building projects one commit at a time.' },
  { userName: 'mariam_ui', fullName: 'Mariam Adel', email: 'mariam@example.com', profilePic: 'https://i.pravatar.cc/300?img=9', bio: 'Product design, prototypes and visual stories.' },
  { userName: 'youssef_js', fullName: 'Youssef Khaled', email: 'youssef@example.com', profilePic: 'https://i.pravatar.cc/300?img=14', bio: 'JavaScript developer learning something every day.' },
  { userName: 'nour_frontend', fullName: 'Nour Ahmed', email: 'nour@example.com', profilePic: 'https://i.pravatar.cc/300?img=16', bio: 'Frontend developer | Angular | CSS experiments.' },
  { userName: 'khaled_backend', fullName: 'Khaled Samir', email: 'khaled@example.com', profilePic: 'https://i.pravatar.cc/300?img=17', bio: 'Backend APIs, databases and clean architecture.' },
  { userName: 'jana_photo', fullName: 'Jana Mahmoud', email: 'jana@example.com', profilePic: 'https://i.pravatar.cc/300?img=20', bio: 'Photography, travel and little everyday moments.' },
  { userName: 'mostafa_node', fullName: 'Mostafa Tarek', email: 'mostafa@example.com', profilePic: 'https://i.pravatar.cc/300?img=15', bio: 'Node.js, MongoDB and learning in public.' },
  { userName: 'lina_creative', fullName: 'Lina Hassan', email: 'lina@example.com', profilePic: 'https://i.pravatar.cc/300?img=25', bio: 'Creative ideas, design notes and inspiration.' },
  { userName: 'karim_dev', fullName: 'Karim Ahmed', email: 'karim@example.com', profilePic: 'https://i.pravatar.cc/300?img=18', bio: 'Software engineer. Always curious.' },
];

// At 12 users this creates exactly 10 follows and 10 followers per account.
// If more users are added later, each account follows everyone except itself
// and one adjacent account, so the minimum remains at least 10.
const POSTS_PER_USER = 8;
const REELS_PER_USER = 4;
const STORIES_PER_USER = 5;
const CHAT_MESSAGES_MIN = 32;
const CHAT_MESSAGES_MAX = 50;

const CAPTIONS = [
  'Building something new today. Small steps still count.',
  'Another productive day. Progress over perfection.',
  'Clean code, better software. What are you working on?',
  'Learning something new and sharing the process.',
  'A little inspiration for the next project.',
  'Good things take time. Keep showing up.',
  'Coffee, code, and a plan for the week.',
  'Late-night ideas that turned into real features.',
  'Consistency is everything. One day at a time.',
  'A new chapter begins. Excited for what comes next.',
  'A few details can make a big difference.',
  'Working on the small things that improve the whole experience.',
  'Weekend mood: explore, create, repeat.',
  'Saving this moment before moving to the next one.',
  'Behind every polished screen is a lot of iteration.',
  'Sharing the journey, not just the final result.',
  'What would you improve in this design?',
  'Today’s reminder: take a break and come back with fresh eyes.',
  'Less noise, more focus.',
  'Made with curiosity and a little bit of patience.',
];

const COMMENT_TEXTS = [
  'This looks really good!',
  'Love the details here.',
  'Great work. Keep going!',
  'The layout feels so clean.',
  'This is genuinely helpful.',
  'Nice shot! Where was this?',
  'I like the colors you chose.',
  'Saved this for later.',
  'That is a clever solution.',
  'Could you share how you built this?',
  'The little details make it.',
  'Exactly the kind of inspiration I needed today.',
  'Looking forward to the next update.',
  'This deserves more attention.',
  'Really nice progress!',
  'I had a similar issue last week.',
  'Thanks for sharing the process.',
  'Simple and effective. Nice work.',
  'The result is worth the effort.',
  'This gave me an idea for my own project.',
];

const REPLY_TEXTS = [
  'Thank you! I appreciate it.',
  'Thanks for checking it out.',
  'I can share more details soon.',
  'That is a good point; I will try it.',
  'Glad it was useful!',
  'I learned a lot while building it.',
  'Exactly what I was aiming for.',
  'Thanks for the suggestion.',
  'I will post an update when it is ready.',
  'Good question. I will explain it in another post.',
  'That sounds like a good approach too.',
  'Appreciate the feedback!',
];

const POST_IMAGE_IDS = [
  '1498050108023-c5249f4df085',
  '1517245386807-bb43f82c33c4',
  '1516321318423-f06f85e504b3',
  '1522202176988-66273c2fd55f',
  '1519389950473-47ba0277781c',
  '1556761175-b413da4baf72',
  '1553877522-43269d4ea984',
  '1521737711867-e3b97375f902',
  '1551434678-e076c223a692',
  '1524758631624-e2822e304c36',
  '1516321497487-e288fb19713f',
  '1522071820081-009f0129c71c',
  '1524504388940-b1c1722653e1',
  '1500530855697-b586d89ba3ee',
  '1497366754035-f200968a6e72',
  '1497366216548-37526070297c',
];

const STORY_IMAGE_IDS = [
  '1497366811353-6870744d04b2',
  '1497366754035-f200968a6e72',
  '1517245386807-bb43f82c33c4',
  '1497366216548-37526070297c',
  '1500530855697-b586d89ba3ee',
  '1516321497487-e288fb19713f',
  '1521737711867-e3b97375f902',
];

// Public sample videos, useful for development data. Replace with your own
// permitted media URLs if you want the seed to match your production assets.
const REEL_VIDEO_URLS = [
  // Big Buck Bunny — فيديو طويل
  'https://uploads.video-commander.com/sample/BigBuckBunny.mp4',

  // Big Buck Bunny — مقطع صغير للاختبار
  'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',

  // Big Buck Bunny — مصدر آخر
  'https://www.w3schools.com/html/mov_bbb.mp4',

  // Sintel — مقطع قصير
  'https://test-videos.co.uk/vids/sintel/mp4/h264/720/Sintel_720_10s_2MB.mp4',

  // فيديو قصير من MDN
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',

  // فيديو عمودي لاختبار تخطيط Reels
  'https://cdn.truefilesize.com/mp4/sample-portrait.mp4',
];

const DIALOGUE_EXCHANGES = [
  ['Hey! How has your week been?', 'Pretty good, just finishing a few things. How about you?'],
  ['I saw your latest post. The details look great.', 'Thanks! I spent a while getting the spacing right.'],
  ['Are you still working on that new feature?', 'Yes. The main flow works; I am polishing the edge cases now.'],
  ['What are you using for the backend?', 'Node.js and MongoDB for this one. It has been a good learning project.'],
  ['I got stuck on a responsive layout today.', 'Those can be tricky. Did you try using grid for the outer layout?'],
  ['That is a good idea. I will give it a try.', 'Let me know how it goes. Happy to look at the CSS if needed.'],
  ['Have you learned anything useful recently?', 'I have been focusing on cleaner API responses and better validation.'],
  ['I should spend more time on testing.', 'Same here. Small tests save a lot of debugging later.'],
  ['Do you have any plans for the weekend?', 'Maybe a coffee, a walk, and a little side project. Nothing too intense.'],
  ['That sounds like a good balance.', 'Trying to keep it that way. Rest makes the next week better.'],
  ['Could you take a look at my latest design?', 'Sure, send it over. I can review it after I finish this task.'],
  ['Sent it. I am not sure about the button hierarchy.', 'I would make the primary action brighter and keep the secondary one quieter.'],
  ['I like that. The page already feels clearer.', 'Great! Visual hierarchy makes a surprising difference.'],
  ['Did you fix the issue you mentioned?', 'Yes, it was a state update happening before the request succeeded.'],
  ['Those bugs are difficult to spot.', 'They are. Logging the response shape helped me narrow it down.'],
  ['I have been trying to improve my English too.', 'A little speaking practice every day helped me more than cramming.'],
  ['Do you follow any good tech creators?', 'A few. I prefer people who explain the trade-offs, not only the final code.'],
  ['I am planning to refactor an older project.', 'Make a small checklist first so the working features do not regress.'],
  ['Thanks for the tip. I tend to change too much at once.', 'I do that too. Small, reviewable changes are easier to trust.'],
  ['What are you building next?', 'Probably a better messaging flow and some seed data for testing.'],
  ['The demo data will make UI testing much easier.', 'Exactly. Empty states are useful, but realistic data shows layout problems.'],
  ['I pushed a new version a few minutes ago.', 'Nice! I will check it later and send you feedback.'],
  ['No rush. I am just happy the main flow works now.', 'That is a good milestone. Remember to test the mobile view too.'],
  ['Any recommendation for keeping a project organized?', 'Keep business logic out of components where possible, and name things clearly.'],
  ['I have been cleaning up old services this week.', 'It is satisfying when the structure starts making sense.'],
  ['What do you think about this color palette?', 'The contrast is good. I would check the muted text against the background.'],
  ['Good point. I did not test it in a dim screen.', 'Testing with real content often reveals things a mockup hides.'],
  ['I am going to take a short break, then finish the last part.', 'Good plan. See you later, and good luck finishing it.'],
];

const COLLECTION_NAMES = ['Favorites', 'Inspiration', 'Design Ideas'];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem(items) {
  if (!items.length) throw new Error('Cannot choose a random item from an empty list.');
  return items[randomInt(0, items.length - 1)];
}

function sample(items, count) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(count, copy.length));
}

function idOf(value) {
  return String(value?._id ?? value);
}

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(randomInt(7, 23), randomInt(0, 59), randomInt(0, 59), 0);
  return date;
}

function hoursAgo(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000 - randomInt(0, 50 * 60 * 1000));
}

function messageDateTime(date) {
  return {
    date: date.toLocaleDateString('en-US'),
    time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    createdAt: date,
    updatedAt: date,
  };
}

function createComments(users, author, minimum = 5, maximum = 9) {
  const possibleCommenters = users.filter((user) => idOf(user) !== idOf(author));
  const commenters = sample(possibleCommenters, randomInt(minimum, Math.min(maximum, possibleCommenters.length)));

  return commenters.map((commenter) => {
    const createdAt = daysAgo(randomInt(0, 25));
    const possibleRepliers = users.filter(
      (user) => idOf(user) !== idOf(commenter) && idOf(user) !== idOf(author),
    );
    const replies = sample(possibleRepliers, randomInt(0, 3)).map((replier, index) => {
      const replyDate = new Date(createdAt.getTime() + (index + 1) * randomInt(2, 80) * 60 * 1000);
      return {
        userId: replier._id,
        reply: randomItem(REPLY_TEXTS),
        hide: false,
        createdAt: replyDate,
        updatedAt: replyDate,
      };
    });

    return {
      userId: commenter._id,
      comment: randomItem(COMMENT_TEXTS),
      replies,
      createdAt,
      updatedAt: createdAt,
    };
  });
}

function createLikes(users, author, minimum = 3, maximum = 10) {
  const candidates = users.filter((user) => idOf(user) !== idOf(author));
  return sample(candidates, randomInt(minimum, Math.min(maximum, candidates.length))).map((user) => user._id);
}

async function removeLegacyChatIndexes() {
  // An older version of the Chat schema had a unique participantKey index.
  // Keeping that stale index can make every chat after the first one fail.
  let indexes = [];
  try {
    indexes = await Chat.collection.indexes();
  } catch (error) {
    if (error?.codeName !== 'NamespaceNotFound' && error?.code !== 26) throw error;
  }

  for (const index of indexes) {
    if (index.name === 'participantKey_1') {
      await Chat.collection.dropIndex(index.name);
      console.log('Removed outdated Chat index participantKey_1.');
    }
  }
}

async function clearDatabase() {
  await Promise.all([
    Chat.deleteMany({}),
    Story.deleteMany({}),
    Post.deleteMany({}),
    Reel.deleteMany({}),
    User.deleteMany({}),
  ]);
  console.log('Cleared User, Post, Reel, Story and Chat collections.');
}

async function createUsers() {
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, Number(process.env.ROUNDS || 10));
  const now = new Date();
  const documents = USERS_DATA.map((user, index) => ({
    userName: USERNAME_LOWERCASE ? user.userName.toLowerCase() : user.userName,
    fullName: user.fullName,
    email: user.email.toLowerCase(),
    password: hashedPassword,
    profilePic: user.profilePic,
    profilePicType: 'UserImage',
    registerType: 'default',
    bio: user.bio,
    active: true,
    confirmEmail: true,
    blocked: false,
    likes: [],
    stories: [],
    posts: [],
    following: [],
    followers: [],
    visited: [],
    reels: [],
    chats: [],
    savedPosts: [],
    savedReels: [],
    collections: [],
    notifications: [],
    createdAt: daysAgo(randomInt(80, 360) + index),
    updatedAt: now,
  }));

  const users = await User.insertMany(documents);
  console.log(`Created ${users.length} demo users.`);
  return users;
}

async function createFollowGraph(users) {
  if (users.length < 12) {
    throw new Error(`At least 12 seed users are required to guarantee 10 followers and 10 following. Found ${users.length}.`);
  }

  const followingByUser = new Map();
  const followersByUser = new Map(users.map((user) => [idOf(user), []]));

  users.forEach((user, index) => {
    const excludedNextUser = users[(index + 1) % users.length];
    const following = users.filter(
      (candidate) => idOf(candidate) !== idOf(user) && idOf(candidate) !== idOf(excludedNextUser),
    );
    followingByUser.set(idOf(user), following);

    for (const target of following) {
      followersByUser.get(idOf(target)).push(user);
    }
  });

  await User.bulkWrite(users.map((user) => ({
    updateOne: {
      filter: { _id: user._id },
      update: {
        $set: {
          following: followingByUser.get(idOf(user)).map((person) => person._id),
          followers: followersByUser.get(idOf(user)).map((person) => person._id),
        },
      },
    },
  })));

  const minFollowing = Math.min(...users.map((user) => followingByUser.get(idOf(user)).length));
  const minFollowers = Math.min(...users.map((user) => followersByUser.get(idOf(user)).length));
  console.log(`Created follow graph. Minimum following: ${minFollowing}; minimum followers: ${minFollowers}.`);
  return { followingByUser, followersByUser };
}

async function createPosts(users) {
  const documents = [];
  for (const user of users) {
    const otherUsers = users.filter((candidate) => idOf(candidate) !== idOf(user));
    for (let index = 0; index < POSTS_PER_USER; index += 1) {
      const createdAt = daysAgo(randomInt(0, 85));
      const mediaCount = index % 3 === 0 ? randomInt(2, 4) : 1;
      const media = sample(POST_IMAGE_IDS, mediaCount).map((imageId, mediaIndex) => ({
        url: `https://images.unsplash.com/photo-${imageId}?auto=format&fit=crop&w=1200&q=85`,
        public_id: `seed_post_${user.userName}_${index + 1}_${mediaIndex + 1}`,
        type: 'image',
      }));

      documents.push({
        caption: randomItem(CAPTIONS),
        postsImgAndVideos: media,
        createdBy: user._id,
        tags: sample(otherUsers, randomInt(1, 4)).map((person) => person._id),
        likes: createLikes(users, user, 4, 10),
        comments: createComments(users, user, 5, 9),
        createdAt,
        updatedAt: createdAt,
      });
    }
  }

  const posts = await Post.insertMany(documents, { ordered: true });
  console.log(`Created ${posts.length} posts (${POSTS_PER_USER} per user).`);
  return posts;
}

async function createReels(users) {
  const documents = [];
  for (const user of users) {
    const otherUsers = users.filter((candidate) => idOf(candidate) !== idOf(user));
    for (let index = 0; index < REELS_PER_USER; index += 1) {
      const createdAt = daysAgo(randomInt(0, 60));
      documents.push({
        caption: randomItem(CAPTIONS),
        public_id: `seed_reel_${user.userName}_${index + 1}`,
        url: randomItem(REEL_VIDEO_URLS),
        createdBy: user._id,
        tags: sample(otherUsers, randomInt(1, 4)).map((person) => person._id),
        likes: createLikes(users, user, 3, 10),
        comments: createComments(users, user, 5, 8),
        createdAt,
        updatedAt: createdAt,
      });
    }
  }

  const reels = await Reel.insertMany(documents, { ordered: true });
  console.log(`Created ${reels.length} Reels (${REELS_PER_USER} per user).`);
  return reels;
}

async function createStories(users) {
  const documents = [];
  for (const user of users) {
    const otherUsers = users.filter((candidate) => idOf(candidate) !== idOf(user));
    for (let index = 0; index < STORIES_PER_USER; index += 1) {
      const createdAt = hoursAgo(randomInt(1, 20));
      const imageId = randomItem(STORY_IMAGE_IDS);
      documents.push({
        caption: randomItem(CAPTIONS),
        duration: randomInt(5, 10),
        left: `${randomInt(35, 55)}%`,
        top: `${randomInt(40, 60)}%`,
        color: randomItem(['#ffffff', '#ffcfdf', '#d9f2ff', '#f6e5b5', '#d7ffd9']),
        public_id: `seed_story_${user.userName}_${index + 1}`,
        url: `https://images.unsplash.com/photo-${imageId}?auto=format&fit=crop&w=1000&q=85`,
        createdBy: user._id,
        viewer: sample(otherUsers, randomInt(2, 8)).map((person) => person._id),
        likes: sample(otherUsers, randomInt(1, 6)).map((person) => person._id),
        type: 'image',
        createdAt,
        updatedAt: createdAt,
      });
    }
  }

  const stories = await Story.insertMany(documents, { ordered: true });
  console.log(`Created ${stories.length} stories (${STORIES_PER_USER} per user).`);
  return stories;
}

async function createChats(users) {
  const documents = [];
  const chatsByUser = new Map(users.map((user) => [idOf(user), []]));
  let totalMessages = 0;

  for (let firstIndex = 0; firstIndex < users.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < users.length; secondIndex += 1) {
      const firstUser = users[firstIndex];
      const secondUser = users[secondIndex];
      const count = randomInt(CHAT_MESSAGES_MIN, CHAT_MESSAGES_MAX);
      const startDate = daysAgo(randomInt(3, 45));
      const messages = [];
      const shuffledExchanges = sample(DIALOGUE_EXCHANGES, DIALOGUE_EXCHANGES.length);
      let elapsedMinutes = 0;

      for (let messageIndex = 0; messageIndex < count; messageIndex += 1) {
        const exchange = shuffledExchanges[Math.floor(messageIndex / 2) % shuffledExchanges.length];
        const text = exchange[messageIndex % 2];
        if (messageIndex > 0) elapsedMinutes += randomInt(2, 18);
        const timestamp = new Date(startDate.getTime() + elapsedMinutes * 60 * 1000);
        messages.push({
          message: text,
          images: [],
          sender: messageIndex % 2 === 0 ? firstUser._id : secondUser._id,
          ...messageDateTime(timestamp),
        });
      }

      const chat = {
        userIds: [firstUser._id, secondUser._id],
        type: 'chat',
        messages,
        createdAt: startDate,
        updatedAt: messages[messages.length - 1]?.createdAt ?? startDate,
      };
      documents.push(chat);
      totalMessages += messages.length;
    }
  }

  const chats = await Chat.insertMany(documents, { ordered: true });
  for (const chat of chats) {
    for (const participantId of chat.userIds) {
      const userChats = chatsByUser.get(idOf(participantId));
      if (userChats) userChats.push(chat._id);
    }
  }

  console.log(`Created ${chats.length} one-to-one conversations with ${totalMessages} messages (minimum ${CHAT_MESSAGES_MIN} per conversation).`);
  return { chats, chatsByUser, totalMessages };
}

async function updateUserReferences({ users, posts, reels, stories, savedByUser, collectionsByUser, notificationsByUser, chatsByUser, followingByUser, followersByUser }) {
  const writes = users.map((user) => {
    const userId = idOf(user);
    const userPosts = posts.filter((item) => idOf(item.createdBy) === userId).map((item) => item._id);
    const userReels = reels.filter((item) => idOf(item.createdBy) === userId).map((item) => item._id);
    const userStories = stories.filter((item) => idOf(item.createdBy) === userId).map((item) => item._id);
    const saved = savedByUser.get(userId);

    return {
      updateOne: {
        filter: { _id: user._id },
        update: {
          $set: {
            posts: userPosts,
            reels: userReels,
            stories: userStories,
            following: followingByUser.get(userId).map((person) => person._id),
            followers: followersByUser.get(userId).map((person) => person._id),
            chats: chatsByUser.get(userId) ?? [],
            savedPosts: saved.posts,
            savedReels: saved.reels,
            collections: collectionsByUser.get(userId) ?? [],
            notifications: notificationsByUser.get(userId) ?? [],
            visited: sample(users.filter((candidate) => idOf(candidate) !== userId), randomInt(3, 7)).map((person) => person._id),
          },
        },
      },
    };
  });

  await User.bulkWrite(writes);
}

function createSavedData(users, posts, reels) {
  const savedByUser = new Map();
  const collectionsByUser = new Map();

  for (const user of users) {
    const userId = idOf(user);
    const otherPosts = posts.filter((post) => idOf(post.createdBy) !== userId);
    const otherReels = reels.filter((reel) => idOf(reel.createdBy) !== userId);
    const savedPosts = sample(otherPosts, randomInt(6, 10));
    const savedReels = sample(otherReels, randomInt(2, 4));
    savedByUser.set(userId, {
      posts: savedPosts.map((post) => post._id),
      reels: savedReels.map((reel) => reel._id),
    });

    const collections = COLLECTION_NAMES.slice(0, 2 + (Math.random() > 0.55 ? 1 : 0)).map((name, index) => {
      const count = Math.min(savedPosts.length, index === 0 ? 5 : randomInt(3, 4));
      return {
        collectionName: name,
        saved: sample(savedPosts, count).map((post) => post._id),
      };
    });
    collectionsByUser.set(userId, collections);
  }

  return { savedByUser, collectionsByUser };
}

function createNotifications(users, posts, reels) {
  const notificationsByUser = new Map();
  for (const recipient of users) {
    const others = users.filter((user) => idOf(user) !== idOf(recipient));
    const notifications = [];

    for (let index = 0; index < randomInt(8, 12); index += 1) {
      const sender = randomItem(others);
      const kind = randomInt(0, 3);
      let text;
      let type;
      let redirect;

      if (kind === 0) {
        text = `${sender.userName} started following you`;
        type = 'follow';
        redirect = `/userProfile/${sender._id}`;
      } else if (kind === 1) {
        randomItem(posts.filter((item) => idOf(item.createdBy) === idOf(recipient)));
        text = `${sender.userName} liked your post`;
        type = 'like';
        redirect = `/userProfile/${sender._id}`;
      } else if (kind === 2) {
        randomItem(reels.filter((item) => idOf(item.createdBy) === idOf(recipient)));
        text = `${sender.userName} commented on your Reel`;
        type = 'comment';
        redirect = `/userProfile/${sender._id}`;
      } else {
        randomItem(posts.filter((item) => idOf(item.createdBy) === idOf(recipient)));
        text = `${sender.userName} mentioned you in a conversation`;
        type = 'comment';
        redirect = `/userProfile/${sender._id}`;
      }

      notifications.push({
        text,
        seen: Math.random() > 0.6,
        type,
        data: sender._id,
        redirect,
        createdAt: daysAgo(randomInt(0, 18)),
      });
    }
    notificationsByUser.set(idOf(recipient), notifications);
  }
  return notificationsByUser;
}

async function verifySeed({ users, posts, reels, stories, chats, totalMessages, followingByUser, followersByUser }) {
  const ownedCounts = users.map((user) => {
    const userId = idOf(user);
    return {
      userName: user.userName,
      followers: followersByUser.get(userId).length,
      following: followingByUser.get(userId).length,
      postsAndReels: posts.filter((item) => idOf(item.createdBy) === userId).length + reels.filter((item) => idOf(item.createdBy) === userId).length,
      stories: stories.filter((item) => idOf(item.createdBy) === userId).length,
      chats: chats.filter((chat) => chat.userIds.some((participantId) => idOf(participantId) === userId)).length,
    };
  });

  const minimums = {
    followers: Math.min(...ownedCounts.map((row) => row.followers)),
    following: Math.min(...ownedCounts.map((row) => row.following)),
    postsAndReels: Math.min(...ownedCounts.map((row) => row.postsAndReels)),
    stories: Math.min(...ownedCounts.map((row) => row.stories)),
  };

  if (minimums.followers < 10 || minimums.following < 10 || minimums.postsAndReels < 10 || minimums.stories <= 2) {
    throw new Error(`Seed verification failed: ${JSON.stringify(minimums)}`);
  }

  console.log('\n============== SEED SUMMARY ==============');
  console.log(`Users: ${users.length}`);
  console.log(`Posts: ${posts.length}`);
  console.log(`Reels: ${reels.length}`);
  console.log(`Stories: ${stories.length}`);
  console.log(`Chats: ${chats.length}`);
  const allContent = [...posts, ...reels];
  const totalComments = allContent.reduce((sum, item) => sum + (item.comments?.length ?? 0), 0);
  const totalReplies = allContent.reduce(
    (sum, item) => sum + (item.comments ?? []).reduce((commentSum, comment) => commentSum + (comment.replies?.length ?? 0), 0),
    0,
  );
  const totalContentLikes = allContent.reduce((sum, item) => sum + (item.likes?.length ?? 0), 0);
  const totalStoryLikes = stories.reduce((sum, item) => sum + (item.likes?.length ?? 0), 0);
  console.log(`Chat messages: ${totalMessages}`);
  console.log(`Comments: ${totalComments}; replies: ${totalReplies}`);
  console.log(`Content likes: ${totalContentLikes}; story likes: ${totalStoryLikes}`);
  console.log(`Minimum per user: ${JSON.stringify(minimums)}`);
  console.log('Demo login: demo@instagram.local');
  console.log('Demo password: value of DEMO_PASSWORD (defaults to Demo12345!)');
  console.log('===========================================\n');
}

async function main() {
  if (!MONGO_URI) {
    throw new Error('MONGO_URI is missing. Add MONGO_URI to your backend .env file.');
  }

  // if (process.env.SEED_CLEAR_DATABASE !== 'true') {
  //   throw new Error(
  //     'Safety stop: this seed clears User, Post, Reel, Story and Chat collections. Set SEED_CLEAR_DATABASE=true only for a development database you intend to reset.',
  //   );
  // }

  // if (process.env.DNS_PRIMARY || process.env.DNS_SECONDARY) {
    dns.setServers([
      process.env.DNS_PRIMARY || '8.8.8.8',
      process.env.DNS_SECONDARY || '8.8.4.4',
    ]);
  // }

  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    await removeLegacyChatIndexes();
    await clearDatabase();

    const users = await createUsers();
    const { followingByUser, followersByUser } = await createFollowGraph(users);
    const posts = await createPosts(users);
    const reels = await createReels(users);
    const stories = await createStories(users);
    const { chats, chatsByUser, totalMessages } = await createChats(users);

    const { savedByUser, collectionsByUser } = createSavedData(users, posts, reels);
    const notificationsByUser = createNotifications(users, posts, reels);

    await updateUserReferences({
      users,
      posts,
      reels,
      stories,
      savedByUser,
      collectionsByUser,
      notificationsByUser,
      chatsByUser,
      followingByUser,
      followersByUser,
    });

    await verifySeed({ users, posts, reels, stories, chats, totalMessages, followingByUser, followersByUser });
  } finally {
    await mongoose.disconnect().catch(() => undefined);
  }
}

main().catch((error) => {
  console.error('\nExpanded seed failed:', error?.message || error);
  process.exitCode = 1;
});
