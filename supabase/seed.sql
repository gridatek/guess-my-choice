-- Seed file for Guess My Choice game
-- This file is safe to run multiple times (uses upserts/checks)

-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- SEED USERS (via auth.users)
-- ============================================
-- Note: In production, users sign up via the API
-- For development, we insert directly into auth.users

-- Insert test users into auth.users
-- Password for all test users: "password123"
-- Using PostgreSQL's crypt() to generate bcrypt hash at insert time

INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    email_change_token_current,
    email_change_confirm_status,
    recovery_token,
    phone_change,
    phone_change_token,
    reauthentication_token,
    role,
    aud,
    is_sso_user,
    is_super_admin
) VALUES
    -- User 1: Alice (Admin)
    (
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
        '00000000-0000-0000-0000-000000000000'::uuid,
        'alice@example.com',
        crypt('password123', gen_salt('bf')),
        NOW(),
        '{"full_name": "Alice Admin", "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice"}',
        NOW(),
        NOW(),
        '',
        '',
        '',
        '',
        0,
        '',
        '',
        '',
        '',
        'authenticated',
        'authenticated',
        false,
        false
    ),
    -- User 2: Bob (Player)
    (
        'b1ffbc99-9c0b-4ef8-bb6d-6bb9bd380a22'::uuid,
        '00000000-0000-0000-0000-000000000000'::uuid,
        'bob@example.com',
        crypt('password123', gen_salt('bf')),
        NOW(),
        '{"full_name": "Bob Player", "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob"}',
        NOW(),
        NOW(),
        '',
        '',
        '',
        '',
        0,
        '',
        '',
        '',
        '',
        'authenticated',
        'authenticated',
        false,
        false
    ),
    -- User 3: Carol (Player)
    (
        'c2ffbc99-9c0b-4ef8-bb6d-6bb9bd380a33'::uuid,
        '00000000-0000-0000-0000-000000000000'::uuid,
        'carol@example.com',
        crypt('password123', gen_salt('bf')),
        NOW(),
        '{"full_name": "Carol Player", "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Carol"}',
        NOW(),
        NOW(),
        '',
        '',
        '',
        '',
        0,
        '',
        '',
        '',
        '',
        'authenticated',
        'authenticated',
        false,
        false
    )
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- CREATE/UPDATE PROFILES
-- ============================================

INSERT INTO public.profiles (id, full_name, avatar_url, username, bio, is_admin)
VALUES
    (
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
        'Alice Admin',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
        'alice',
        'Game administrator',
        true  -- Alice is an admin
    ),
    (
        'b1ffbc99-9c0b-4ef8-bb6d-6bb9bd380a22'::uuid,
        'Bob Player',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
        'bob',
        'Loves playing games',
        false
    ),
    (
        'c2ffbc99-9c0b-4ef8-bb6d-6bb9bd380a33'::uuid,
        'Carol Player',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Carol',
        'carol',
        'Game enthusiast',
        false
    )
ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    bio = EXCLUDED.bio,
    is_admin = EXCLUDED.is_admin,
    updated_at = NOW();

-- ============================================
-- SEED OPTION CATEGORIES
-- ============================================

INSERT INTO public.option_categories (id, name, slug, description) VALUES
    ('caa00001-0000-0000-0000-000000000001'::uuid, 'Activities', 'activities', 'Things to do and experiences'),
    ('caa00002-0000-0000-0000-000000000002'::uuid, 'Food & Drink', 'food-drink', 'Culinary preferences and choices'),
    ('caa00003-0000-0000-0000-000000000003'::uuid, 'Entertainment', 'entertainment', 'Movies, music, and media'),
    ('caa00004-0000-0000-0000-000000000004'::uuid, 'Travel', 'travel', 'Destinations and vacation preferences'),
    ('caa00005-0000-0000-0000-000000000005'::uuid, 'Romantic', 'romantic', 'Romantic scenarios and date ideas'),
    ('caa00006-0000-0000-0000-000000000006'::uuid, 'Intimate', 'intimate', 'Personal and intimate choices'),
    ('caa00007-0000-0000-0000-000000000007'::uuid, 'Hobbies', 'hobbies', 'Interests and pastimes'),
    ('caa00008-0000-0000-0000-000000000008'::uuid, 'Lifestyle', 'lifestyle', 'Daily life and routines')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- SEED GAME OPTIONS
-- ============================================

INSERT INTO public.options (
    id,
    user_id,
    option_text,
    description,
    session_type,
    difficulty_level,
    status,
    tags
) VALUES
    -- Friends session type options
    ('00000001-0000-0000-0000-000000000001'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Go to the beach', 'Spend a day at the beach', 'friends', 1, 'published', ARRAY['outdoor', 'summer']),
    ('00000002-0000-0000-0000-000000000002'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Watch a movie', 'Watch a movie together', 'friends', 1, 'published', ARRAY['indoor', 'relaxing']),
    ('00000003-0000-0000-0000-000000000003'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Play video games', 'Gaming session', 'friends', 1, 'published', ARRAY['indoor', 'gaming']),
    ('00000004-0000-0000-0000-000000000004'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Go hiking', 'Hike in nature', 'friends', 2, 'published', ARRAY['outdoor', 'active']),
    ('00000005-0000-0000-0000-000000000005'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Try a new restaurant', 'Explore new cuisine', 'friends', 2, 'published', ARRAY['food', 'adventure']),
    ('00000006-0000-0000-0000-000000000006'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Attend a concert', 'See live music', 'friends', 2, 'published', ARRAY['music', 'entertainment']),
    ('00000007-0000-0000-0000-000000000007'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Have a picnic', 'Outdoor dining', 'friends', 1, 'published', ARRAY['outdoor', 'food']),
    ('00000008-0000-0000-0000-000000000008'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Go bowling', 'Bowl a few games', 'friends', 1, 'published', ARRAY['indoor', '3000']),
    ('00000009-0000-0000-0000-000000000009'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Visit a museum', 'Cultural exploration', 'friends', 2, 'published', ARRAY['culture', 'educational']),
    ('00000010-0000-0000-0000-000000000010'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Have game night', 'Board games with friends', 'friends', 1, 'published', ARRAY['indoor', 'social']),

    -- Couple session type options
    ('00000011-0000-0000-0000-000000000011'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Cook dinner together', 'Prepare a meal as a couple', 'couple', 2, 'published', ARRAY['romantic', 'food']),
    ('00000012-0000-0000-0000-000000000012'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Take a sunset walk', 'Romantic evening stroll', 'couple', 1, 'published', ARRAY['romantic', 'outdoor']),
    ('00000013-0000-0000-0000-000000000013'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Have a spa day', 'Relaxation together', 'couple', 3, 'published', ARRAY['relaxing', 'luxury']),
    ('00000014-0000-0000-0000-000000000014'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Plan a weekend getaway', 'Short trip together', 'couple', 3, 'published', ARRAY['travel', 'romantic']),
    ('00000015-0000-0000-0000-000000000015'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Watch the stars', 'Stargazing together', 'couple', 2, 'published', ARRAY['romantic', 'outdoor']),
    ('00000016-0000-0000-0000-000000000016'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Dance at home', 'Private dance session', 'couple', 2, 'published', ARRAY['romantic', 'fun']),
    ('00000017-0000-0000-0000-000000000017'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Take a couples class', 'Learn something new together', 'couple', 3, 'published', ARRAY['educational', 'bonding']),
    ('00000018-0000-0000-0000-000000000018'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Have breakfast in bed', 'Cozy morning together', 'couple', 1, 'published', ARRAY['romantic', 'relaxing']),
    ('00000019-0000-0000-0000-000000000019'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Give each other massages', 'Relaxing touch', 'couple', 2, 'published', ARRAY['intimate', 'relaxing']),
    ('00000020-0000-0000-0000-000000000020'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Write love letters', 'Express feelings', 'couple', 2, 'published', ARRAY['romantic', 'creative']),

    -- Adult session type options
    ('00000021-0000-0000-0000-000000000021'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Try a new position', 'Experiment in the bedroom', 'adult', 3, 'published', ARRAY['spicy', 'adventurous']),
    ('00000022-0000-0000-0000-000000000022'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Play truth or dare', 'Adult version', 'adult', 2, 'published', ARRAY['fun', 'flirty']),
    ('00000023-0000-0000-0000-000000000023'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Share a fantasy', 'Open communication', 'adult', 3, 'published', ARRAY['intimate', 'communication']),
    ('00000024-0000-0000-0000-000000000024'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Set the mood with candles', 'Create ambiance', 'adult', 2, 'published', ARRAY['romantic', 'sensual']),
    ('00000025-0000-0000-0000-000000000025'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Take a shower together', 'Intimate bathing', 'adult', 2, 'published', ARRAY['intimate', 'playful']),
    ('00000026-0000-0000-0000-000000000026'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Role play scenario', 'Act out fantasies', 'adult', 4, 'published', ARRAY['adventurous', 'playful']),
    ('00000027-0000-0000-0000-000000000027'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Use blindfolds', 'Sensory play', 'adult', 3, 'published', ARRAY['spicy', 'experimental']),
    ('00000028-0000-0000-0000-000000000028'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Send a sexy text', 'Digital flirting', 'adult', 2, 'published', ARRAY['flirty', 'teasing']),
    ('00000029-0000-0000-0000-000000000029'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Watch something together', 'Adult content viewing', 'adult', 3, 'published', ARRAY['entertainment', 'bonding']),
    ('00000030-0000-0000-0000-000000000030'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Plan a romantic evening', 'Set the stage', 'adult', 2, 'published', ARRAY['romantic', 'planning'])
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- ASSIGN CATEGORIES TO OPTIONS
-- ============================================

INSERT INTO public.option_category_assignments (option_id, option_category_id) VALUES
    -- Activities category
    ('00000001-0000-0000-0000-000000000001', 'caa00001-0000-0000-0000-000000000001'),
    ('00000004-0000-0000-0000-000000000004', 'caa00001-0000-0000-0000-000000000001'),
    ('00000007-0000-0000-0000-000000000007', 'caa00001-0000-0000-0000-000000000001'),
    ('00000008-0000-0000-0000-000000000008', 'caa00001-0000-0000-0000-000000000001'),

    -- Food & Drink
    ('00000005-0000-0000-0000-000000000005', 'caa00002-0000-0000-0000-000000000002'),
    ('00000011-0000-0000-0000-000000000011', 'caa00002-0000-0000-0000-000000000002'),

    -- Entertainment
    ('00000002-0000-0000-0000-000000000002', 'caa00003-0000-0000-0000-000000000003'),
    ('00000003-0000-0000-0000-000000000003', 'caa00003-0000-0000-0000-000000000003'),
    ('00000006-0000-0000-0000-000000000006', 'caa00003-0000-0000-0000-000000000003'),

    -- Romantic
    ('00000011-0000-0000-0000-000000000011', 'caa00005-0000-0000-0000-000000000005'),
    ('00000012-0000-0000-0000-000000000012', 'caa00005-0000-0000-0000-000000000005'),
    ('00000015-0000-0000-0000-000000000015', 'caa00005-0000-0000-0000-000000000005'),
    ('00000016-0000-0000-0000-000000000016', 'caa00005-0000-0000-0000-000000000005'),
    ('00000020-0000-0000-0000-000000000020', 'caa00005-0000-0000-0000-000000000005'),

    -- Intimate
    ('00000019-0000-0000-0000-000000000019', 'caa00006-0000-0000-0000-000000000006'),
    ('00000021-0000-0000-0000-000000000021', 'caa00006-0000-0000-0000-000000000006'),
    ('00000023-0000-0000-0000-000000000023', 'caa00006-0000-0000-0000-000000000006'),
    ('00000025-0000-0000-0000-000000000025', 'caa00006-0000-0000-0000-000000000006')
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED QUESTIONS (prompts for game rounds)
-- ============================================

INSERT INTO public.questions (
    id,
    user_id,
    question_text,
    description,
    session_type,
    status,
    tags
) VALUES
    -- Friends session type questions
    ('10000001-0000-0000-0000-000000000001'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'What would I prefer to do this weekend?', 'Casual activity preference', 'friends', 'published', ARRAY['weekend', 'activity']),
    ('10000002-0000-0000-0000-000000000002'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'How would I like to spend a free evening?', 'Evening plans', 'friends', 'published', ARRAY['evening', 'relaxation']),
    ('10000003-0000-0000-0000-000000000003'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'What kind of adventure sounds fun to me?', 'Adventure preference', 'friends', 'published', ARRAY['adventure', 'excitement']),
    ('10000004-0000-0000-0000-000000000004'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'What would make me happiest right now?', 'Current mood', 'friends', 'published', ARRAY['mood', 'happiness']),
    ('10000005-0000-0000-0000-000000000005'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Which activity would I choose for us?', 'Group activity', 'friends', 'published', ARRAY['group', 'bonding']),

    -- Couple session type questions
    ('10000006-0000-0000-0000-000000000006'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'What romantic gesture would I appreciate most?', 'Romance preference', 'couple', 'published', ARRAY['romance', 'gestures']),
    ('10000007-0000-0000-0000-000000000007'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'How would I like us to spend quality time together?', 'Quality time ideas', 'couple', 'published', ARRAY['quality-time', 'togetherness']),
    ('10000008-0000-0000-0000-000000000008'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'What would make our next date special?', 'Date ideas', 'couple', 'published', ARRAY['date', 'special']),
    ('10000009-0000-0000-0000-000000000009'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'What would help us connect deeper?', 'Connection building', 'couple', 'published', ARRAY['connection', 'intimacy']),
    ('10000010-0000-0000-0000-000000000010'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'What romantic activity am I craving?', 'Romantic desires', 'couple', 'published', ARRAY['romance', 'desire']),

    -- Adult session type questions
    ('10000011-0000-0000-0000-000000000011'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'What would spice up our evening?', 'Evening excitement', 'adult', 'published', ARRAY['spicy', 'excitement']),
    ('10000012-0000-0000-0000-000000000012'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'What intimate activity am I in the mood for?', 'Intimate preferences', 'adult', 'published', ARRAY['intimate', 'mood']),
    ('10000013-0000-0000-0000-000000000013'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'What would make tonight unforgettable?', 'Memorable moments', 'adult', 'published', ARRAY['memorable', 'special']),
    ('10000014-0000-0000-0000-000000000014'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'How would I like to connect physically?', 'Physical connection', 'adult', 'published', ARRAY['physical', 'connection']),
    ('10000015-0000-0000-0000-000000000015'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'What fantasy am I curious about?', 'Fantasy exploration', 'adult', 'published', ARRAY['fantasy', 'exploration'])
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- SEED SAMPLE GAME SESSION (for testing)
-- ============================================

INSERT INTO public.game_sessions (
    id,
    player1_id,
    player2_id,
    session_type,
    connection_points,
    status,
    current_round,
    max_rounds,
    session_code,
    started_at
) VALUES
    (
        '30000001-0000-0000-0000-000000000001'::uuid,
        'b1ffbc99-9c0b-4ef8-bb6d-6bb9bd380a22', -- Bob
        'c2ffbc99-9c0b-4ef8-bb6d-6bb9bd380a33', -- Carol
        'friends',
        20,
        'active',
        2,
        10,
        'ABC123',
        NOW() - INTERVAL '10 minutes'
    )
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- SEED SAMPLE GAME ROUNDS (for testing)
-- ============================================

INSERT INTO public.game_rounds (
    id,
    game_session_id,
    round_number,
    selected_options,
    player1_choice,
    player2_guess,
    is_correct,
    points_earned,
    completed_at
) VALUES
    (
        '20000001-0000-0000-0000-000000000001'::uuid,
        '30000001-0000-0000-0000-000000000001',
        1,
        ARRAY[
            '00000001-0000-0000-0000-000000000001'::uuid,
            '00000002-0000-0000-0000-000000000002'::uuid,
            '00000003-0000-0000-0000-000000000003'::uuid,
            '00000004-0000-0000-0000-000000000004'::uuid
        ],
        '00000002-0000-0000-0000-000000000002'::uuid, -- Bob chose "Watch a movie"
        '00000002-0000-0000-0000-000000000002'::uuid, -- Carol guessed "Watch a movie"
        true,
        10,
        NOW() - INTERVAL '8 minutes'
    ),
    (
        '20000002-0000-0000-0000-000000000002'::uuid,
        '30000001-0000-0000-0000-000000000001',
        2,
        ARRAY[
            '00000005-0000-0000-0000-000000000005'::uuid,
            '00000006-0000-0000-0000-000000000006'::uuid,
            '00000007-0000-0000-0000-000000000007'::uuid,
            '00000008-0000-0000-0000-000000000008'::uuid
        ],
        '00000005-0000-0000-0000-000000000005'::uuid, -- Bob chose "Try a new restaurant"
        '00000005-0000-0000-0000-000000000005'::uuid, -- Carol guessed correctly
        true,
        10,
        NOW() - INTERVAL '5 minutes'
    )
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Guess My Choice seed completed!';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Database Statistics:';
    RAISE NOTICE '   Users: %', (SELECT COUNT(*) FROM auth.users WHERE email LIKE '%@example.com');
    RAISE NOTICE '   Profiles: %', (SELECT COUNT(*) FROM public.profiles);
    RAISE NOTICE '   Game Options: %', (SELECT COUNT(*) FROM public.options);
    RAISE NOTICE '   Questions: %', (SELECT COUNT(*) FROM public.questions);
    RAISE NOTICE '   Option Categories: %', (SELECT COUNT(*) FROM public.option_categories);
    RAISE NOTICE '   Game Sessions: %', (SELECT COUNT(*) FROM public.game_sessions);
    RAISE NOTICE '   Game Rounds: %', (SELECT COUNT(*) FROM public.game_rounds);
    RAISE NOTICE '';
    RAISE NOTICE '🔑 Test Credentials:';
    RAISE NOTICE '   Admin: alice@example.com | Password: password123';
    RAISE NOTICE '   Player: bob@example.com | Password: password123';
    RAISE NOTICE '   Player: carol@example.com | Password: password123';
    RAISE NOTICE '';
    RAISE NOTICE '🎮 Sample Game Session: Code ABC123';
END $$;
