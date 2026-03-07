// src/data/blogPosts.js
// Blog post data — replace with API call when CMS is available
// e.g. const blogs = await fetch('/api/blogs').then(r => r.json());

const blogPosts = [
    {
        id: 1,
        title: 'Top 10 Data Structures Hacks',
        author: 'FOCUS MASTER',
        time: '5 MIN READ',
        category: 'COMPUTER SCIENCE',
        date: 'Jan 24, 2026',
        content: `Mastering data structures is the key to writing efficient code. Here are the top 10 hacks every developer should know:\n\n1. Use Hash Maps for O(1) lookups whenever possible.\n2. Understand the trade-offs between Arrays and Linked Lists.\n3. Master recursion, but be mindful of stack overflow.\n4. Circular buffers are great for streaming data.\n5. Binary Search is your best friend for sorted data.\n6. Use Tries for prefix-based searches.\n7. Min-Heaps/Max-Heaps are essential for priority queues.\n8. Don't forget about Space Complexity.\n9. Visualize your data structures before coding.\n10. Practice, practice, practice on Crammerly!`,
        image: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&q=80'
    },
    {
        id: 2,
        title: 'Future of Algorithms',
        author: 'TECH INSIDER',
        time: '8 MIN READ',
        category: 'ARTIFICIAL INTELLIGENCE',
        date: 'Jan 22, 2026',
        content: `As we move further into the decade, algorithms are becoming more autonomous and specialized. Machine learning is no longer just a buzzword; it's a fundamental part of how we process information.\n\nQuantum algorithms are on the horizon, promising to solve problems that are currently impossible for classical computers. Adaptive algorithms that learn from real-time data are becoming the standard in high-frequency trading and personalized medicine.`,
        image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80'
    },
    {
        id: 3,
        title: 'The Art of Deep Work',
        author: 'PRODUCTIVITY NINJA',
        time: '6 MIN READ',
        category: 'LIFESTYLE',
        date: 'Jan 20, 2026',
        content: `Deep work is the ability to focus without distraction on a cognitively demanding task. It's a skill that allows you to quickly master complicated information and produce better results in less time.\n\nIn our world of constant notifications and shallow work, those who can master the art of deep work will have a massive competitive advantage. Set aside blocks of time, turn off your phone, and dive deep into your studies.`,
        image: 'https://images.unsplash.com/photo-1484417894907-623942c8ee29?w=800&q=80'
    },
    {
        id: 4,
        title: 'React 19: What to Expect',
        author: 'JS WIZARD',
        time: '4 MIN READ',
        category: 'DEVELOPMENT',
        date: 'Jan 18, 2026',
        content: `React 19 is bringing some massive changes to how we handle state and side effects. With the introduction of the React Compiler (React Forget), many of the manual useMemo and useCallback optimizations will become a thing of the past.\n\nServer Components are also receiving significant updates to improve how we build full-stack applications with React.`,
        image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80'
    }
];

export default blogPosts;
