-- Database Optimization Script for VSCO TR

-- 1. Optimize Posts Table
-- Used for Profile page (fetching user's posts ordered by their custom order)
CREATE INDEX IF NOT EXISTS idx_posts_user_order ON public.posts(user_id, order_index);

-- Used for Discover/Feed page (fetching latest posts)
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);

-- Used for fetching specific posts (e.g. for reposts)
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);


-- 2. Optimize Reposts Table
-- Used for Profile page (fetching user's reposts)
CREATE INDEX IF NOT EXISTS idx_reposts_user_created ON public.reposts(user_id, created_at DESC);

-- Used for checking repost status
CREATE INDEX IF NOT EXISTS idx_reposts_user_post ON public.reposts(user_id, post_id);


-- 3. Optimize Likes Table
-- Used for checking like status
CREATE INDEX IF NOT EXISTS idx_likes_user_post ON public.likes(user_id, post_id);


-- 4. Optimize Follows Table
-- Used for checking follow status
CREATE INDEX IF NOT EXISTS idx_follows_follower_following ON public.follows(follower_id, following_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_follower ON public.follows(following_id, follower_id);


-- 5. Optimize Profiles Table
-- Used for username lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);


-- 6. Optimize RLS performance (Optional but recommended if RLS is enabled)
-- Ensure RLS policies using these columns are efficient.
-- (No specific command here, but the indexes above will help RLS policies that filter by these columns)

-- 7. Analyze tables to update statistics immediately
ANALYZE public.posts;
ANALYZE public.reposts;
ANALYZE public.likes;
ANALYZE public.follows;
ANALYZE public.profiles;
