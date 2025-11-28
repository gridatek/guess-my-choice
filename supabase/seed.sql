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
    ('cat00001-0000-0000-0000-000000000001'::uuid, 'Activities', 'activities', 'Things to do and experiences'),
    ('cat00002-0000-0000-0000-000000000002'::uuid, 'Food & Drink', 'food-drink', 'Culinary preferences and choices'),
    ('cat00003-0000-0000-0000-000000000003'::uuid, 'Entertainment', 'entertainment', 'Movies, music, and media'),
    ('cat00004-0000-0000-0000-000000000004'::uuid, 'Travel', 'travel', 'Destinations and vacation preferences'),
    ('cat00005-0000-0000-0000-000000000005'::uuid, 'Romantic', 'romantic', 'Romantic scenarios and date ideas'),
    ('cat00006-0000-0000-0000-000000000006'::uuid, 'Intimate', 'intimate', 'Personal and intimate choices'),
    ('cat00007-0000-0000-0000-000000000007'::uuid, 'Hobbies', 'hobbies', 'Interests and pastimes'),
    ('cat00008-0000-0000-0000-000000000008'::uuid, 'Lifestyle', 'lifestyle', 'Daily life and routines')
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
    ('opt00001-0000-0000-0000-000000000001'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Go to the beach', 'Spend a day at the beach', 'friends', 1, 'published', ARRAY['outdoor', 'summer']),
    ('opt00002-0000-0000-0000-000000000002'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Watch a movie', 'Watch a movie together', 'friends', 1, 'published', ARRAY['indoor', 'relaxing']),
    ('opt00003-0000-0000-0000-000000000003'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Play video games', 'Gaming session', 'friends', 1, 'published', ARRAY['indoor', 'gaming']),
    ('opt00004-0000-0000-0000-000000000004'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Go hiking', 'Hike in nature', 'friends', 2, 'published', ARRAY['outdoor', 'active']),
    ('opt00005-0000-0000-0000-000000000005'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Try a new restaurant', 'Explore new cuisine', 'friends', 2, 'published', ARRAY['food', 'adventure']),
    ('opt00006-0000-0000-0000-000000000006'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Attend a concert', 'See live music', 'friends', 2, 'published', ARRAY['music', 'entertainment']),
    ('opt00007-0000-0000-0000-000000000007'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Have a picnic', 'Outdoor dining', 'friends', 1, 'published', ARRAY['outdoor', 'food']),
    ('opt00008-0000-0000-0000-000000000008'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Go bowling', 'Bowl a few games', 'friends', 1, 'published', ARRAY['indoor', 'game']),
    ('opt00009-0000-0000-0000-000000000009'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Visit a museum', 'Cultural exploration', 'friends', 2, 'published', ARRAY['culture', 'educational']),
    ('opt00010-0000-0000-0000-000000000010'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Have game night', 'Board games with friends', 'friends', 1, 'published', ARRAY['indoor', 'social']),

    -- Couple session type options
    ('opt00011-0000-0000-0000-000000000011'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Cook dinner together', 'Prepare a meal as a couple', 'couple', 2, 'published', ARRAY['romantic', 'food']),
    ('opt00012-0000-0000-0000-000000000012'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Take a sunset walk', 'Romantic evening stroll', 'couple', 1, 'published', ARRAY['romantic', 'outdoor']),
    ('opt00013-0000-0000-0000-000000000013'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Have a spa day', 'Relaxation together', 'couple', 3, 'published', ARRAY['relaxing', 'luxury']),
    ('opt00014-0000-0000-0000-000000000014'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Plan a weekend getaway', 'Short trip together', 'couple', 3, 'published', ARRAY['travel', 'romantic']),
    ('opt00015-0000-0000-0000-000000000015'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Watch the stars', 'Stargazing together', 'couple', 2, 'published', ARRAY['romantic', 'outdoor']),
    ('opt00016-0000-0000-0000-000000000016'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Dance at home', 'Private dance session', 'couple', 2, 'published', ARRAY['romantic', 'fun']),
    ('opt00017-0000-0000-0000-000000000017'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Take a couples class', 'Learn something new together', 'couple', 3, 'published', ARRAY['educational', 'bonding']),
    ('opt00018-0000-0000-0000-000000000018'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Have breakfast in bed', 'Cozy morning together', 'couple', 1, 'published', ARRAY['romantic', 'relaxing']),
    ('opt00019-0000-0000-0000-000000000019'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Give each other massages', 'Relaxing touch', 'couple', 2, 'published', ARRAY['intimate', 'relaxing']),
    ('opt00020-0000-0000-0000-000000000020'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Write love letters', 'Express feelings', 'couple', 2, 'published', ARRAY['romantic', 'creative']),

    -- Adult session type options
    ('opt00021-0000-0000-0000-000000000021'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Try a new position', 'Experiment in the bedroom', 'adult', 3, 'published', ARRAY['spicy', 'adventurous']),
    ('opt00022-0000-0000-0000-000000000022'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Play truth or dare', 'Adult version', 'adult', 2, 'published', ARRAY['fun', 'flirty']),
    ('opt00023-0000-0000-0000-000000000023'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Share a fantasy', 'Open communication', 'adult', 3, 'published', ARRAY['intimate', 'communication']),
    ('opt00024-0000-0000-0000-000000000024'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Set the mood with candles', 'Create ambiance', 'adult', 2, 'published', ARRAY['romantic', 'sensual']),
    ('opt00025-0000-0000-0000-000000000025'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Take a shower together', 'Intimate bathing', 'adult', 2, 'published', ARRAY['intimate', 'playful']),
    ('opt00026-0000-0000-0000-000000000026'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Role play scenario', 'Act out fantasies', 'adult', 4, 'published', ARRAY['adventurous', 'playful']),
    ('opt00027-0000-0000-0000-000000000027'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Use blindfolds', 'Sensory play', 'adult', 3, 'published', ARRAY['spicy', 'experimental']),
    ('opt00028-0000-0000-0000-000000000028'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Send a sexy text', 'Digital flirting', 'adult', 2, 'published', ARRAY['flirty', 'teasing']),
    ('opt00029-0000-0000-0000-000000000029'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Watch something together', 'Adult content viewing', 'adult', 3, 'published', ARRAY['entertainment', 'bonding']),
    ('opt00030-0000-0000-0000-000000000030'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Plan a romantic evening', 'Set the stage', 'adult', 2, 'published', ARRAY['romantic', 'planning'])
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- ASSIGN CATEGORIES TO OPTIONS
-- ============================================

INSERT INTO public.option_category_assignments (option_id, option_category_id) VALUES
    -- Activities category
    ('opt00001-0000-0000-0000-000000000001', 'cat00001-0000-0000-0000-000000000001'),
    ('opt00004-0000-0000-0000-000000000004', 'cat00001-0000-0000-0000-000000000001'),
    ('opt00007-0000-0000-0000-000000000007', 'cat00001-0000-0000-0000-000000000001'),
    ('opt00008-0000-0000-0000-000000000008', 'cat00001-0000-0000-0000-000000000001'),

    -- Food & Drink
    ('opt00005-0000-0000-0000-000000000005', 'cat00002-0000-0000-0000-000000000002'),
    ('opt00011-0000-0000-0000-000000000011', 'cat00002-0000-0000-0000-000000000002'),

    -- Entertainment
    ('opt00002-0000-0000-0000-000000000002', 'cat00003-0000-0000-0000-000000000003'),
    ('opt00003-0000-0000-0000-000000000003', 'cat00003-0000-0000-0000-000000000003'),
    ('opt00006-0000-0000-0000-000000000006', 'cat00003-0000-0000-0000-000000000003'),

    -- Romantic
    ('opt00011-0000-0000-0000-000000000011', 'cat00005-0000-0000-0000-000000000005'),
    ('opt00012-0000-0000-0000-000000000012', 'cat00005-0000-0000-0000-000000000005'),
    ('opt00015-0000-0000-0000-000000000015', 'cat00005-0000-0000-0000-000000000005'),
    ('opt00016-0000-0000-0000-000000000016', 'cat00005-0000-0000-0000-000000000005'),
    ('opt00020-0000-0000-0000-000000000020', 'cat00005-0000-0000-0000-000000000005'),

    -- Intimate
    ('opt00019-0000-0000-0000-000000000019', 'cat00006-0000-0000-0000-000000000006'),
    ('opt00021-0000-0000-0000-000000000021', 'cat00006-0000-0000-0000-000000000006'),
    ('opt00023-0000-0000-0000-000000000023', 'cat00006-0000-0000-0000-000000000006'),
    ('opt00025-0000-0000-0000-000000000025', 'cat00006-0000-0000-0000-000000000006')
ON CONFLICT DO NOTHING;

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
        'game0001-0000-0000-0000-000000000001'::uuid,
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
        'round001-0000-0000-0000-000000000001'::uuid,
        'game0001-0000-0000-0000-000000000001',
        1,
        ARRAY[
            'opt00001-0000-0000-0000-000000000001'::uuid,
            'opt00002-0000-0000-0000-000000000002'::uuid,
            'opt00003-0000-0000-0000-000000000003'::uuid,
            'opt00004-0000-0000-0000-000000000004'::uuid
        ],
        'opt00002-0000-0000-0000-000000000002'::uuid, -- Bob chose "Watch a movie"
        'opt00002-0000-0000-0000-000000000002'::uuid, -- Carol guessed "Watch a movie"
        true,
        10,
        NOW() - INTERVAL '8 minutes'
    ),
    (
        'round002-0000-0000-0000-000000000002'::uuid,
        'game0001-0000-0000-0000-000000000001',
        2,
        ARRAY[
            'opt00005-0000-0000-0000-000000000005'::uuid,
            'opt00006-0000-0000-0000-000000000006'::uuid,
            'opt00007-0000-0000-0000-000000000007'::uuid,
            'opt00008-0000-0000-0000-000000000008'::uuid
        ],
        'opt00005-0000-0000-0000-000000000005'::uuid, -- Bob chose "Try a new restaurant"
        'opt00005-0000-0000-0000-000000000005'::uuid, -- Carol guessed correctly
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
