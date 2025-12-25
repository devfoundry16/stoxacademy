-- Seed courses data
-- Note: Run this after create_courses_table.sql

-- Insert courses
INSERT INTO public.courses (id, title, description, thumbnail, duration, lessons_count, level, price, rating, students, instructor, instructor_avatar, features, requirements, what_you_learn) VALUES
(
  'c1e9e7a0-8b7c-4d5e-9f2a-1b3c4d5e6f7a',
  'Stock Market Fundamentals',
  'Learn the basics of stock market trading and investment strategies. This comprehensive course covers everything from understanding market mechanics to developing your first trading strategy.',
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=600&fit=crop',
  '4h 30m',
  6,
  'Beginner',
  49.99,
  4.8,
  1234,
  'John Smith',
  'https://i.pravatar.cc/150?img=12',
  '["Lifetime access", "Certificate of completion", "Downloadable resources", "Mobile and desktop access", "Community support"]',
  '["No prior trading experience required", "Basic understanding of finance helpful", "Computer or mobile device"]',
  '["Understand how stock markets work", "Read and interpret stock charts", "Place different types of orders", "Manage risk in your portfolio", "Develop a trading strategy", "Analyze market trends"]'
),
(
  'c2e9e7a0-8b7c-4d5e-9f2a-1b3c4d5e6f7b',
  'Technical Analysis Mastery',
  'Master chart patterns, indicators, and technical trading strategies',
  'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&h=450&fit=crop',
  '6h 15m',
  18,
  'Intermediate',
  79.99,
  4.9,
  892,
  'Sarah Johnson',
  'https://i.pravatar.cc/150?img=5',
  '["Lifetime access", "Certificate of completion", "Downloadable resources", "Mobile and desktop access", "Community support"]',
  '["Basic understanding of stock markets", "Familiarity with trading platforms", "Computer or mobile device"]',
  '["Master technical indicators", "Identify chart patterns", "Use trading tools effectively", "Develop technical trading strategies", "Understand support and resistance", "Apply trend analysis"]'
),
(
  'c3e9e7a0-8b7c-4d5e-9f2a-1b3c4d5e6f7c',
  'Options Trading Strategies',
  'Comprehensive guide to options trading and advanced strategies',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=450&fit=crop',
  '8h 20m',
  24,
  'Advanced',
  99.99,
  4.7,
  645,
  'Michael Chen',
  'https://i.pravatar.cc/150?img=8',
  '["Lifetime access", "Certificate of completion", "Downloadable resources", "Mobile and desktop access", "Community support", "Advanced trading tools"]',
  '["Strong understanding of stock markets", "Experience with stock trading", "Understanding of derivatives", "Computer or mobile device"]',
  '["Master options trading basics", "Implement advanced strategies", "Manage options portfolio", "Understand Greeks and volatility", "Execute covered calls and puts", "Apply spread strategies"]'
),
(
  'c4e9e7a0-8b7c-4d5e-9f2a-1b3c4d5e6f7d',
  'Cryptocurrency Investment',
  'Understanding blockchain, crypto trading, and portfolio management',
  'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&h=450&fit=crop',
  '5h 45m',
  15,
  'Intermediate',
  69.99,
  4.6,
  1567,
  'Alex Rivera',
  'https://i.pravatar.cc/150?img=15',
  '["Lifetime access", "Certificate of completion", "Downloadable resources", "Mobile and desktop access", "Community support"]',
  '["Basic understanding of financial markets", "Internet connection", "Crypto wallet setup helpful", "Computer or mobile device"]',
  '["Understand blockchain technology", "Trade cryptocurrencies safely", "Build crypto portfolio", "Analyze crypto markets", "Manage crypto risks", "Use DeFi platforms"]'
),
(
  'c5e9e7a0-8b7c-4d5e-9f2a-1b3c4d5e6f7e',
  'Risk Management & Portfolio Building',
  'Learn to build and manage a diversified investment portfolio',
  'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&h=450&fit=crop',
  '3h 30m',
  10,
  'Beginner',
  39.99,
  4.9,
  2103,
  'Emma Davis',
  'https://i.pravatar.cc/150?img=20',
  '["Lifetime access", "Certificate of completion", "Downloadable resources", "Mobile and desktop access", "Community support"]',
  '["Basic understanding of investments", "No prior experience required", "Computer or mobile device"]',
  '["Build diversified portfolio", "Manage investment risks", "Asset allocation strategies", "Rebalancing techniques", "Understand risk tolerance", "Long-term wealth building"]'
),
(
  'c6e9e7a0-8b7c-4d5e-9f2a-1b3c4d5e6f7f',
  'Day Trading Bootcamp',
  'Intensive course on day trading strategies and execution',
  'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&h=450&fit=crop',
  '10h 00m',
  30,
  'Advanced',
  149.99,
  4.8,
  523,
  'David Park',
  'https://i.pravatar.cc/150?img=25',
  '["Lifetime access", "Certificate of completion", "Downloadable resources", "Mobile and desktop access", "Community support", "Live trading sessions"]',
  '["Strong understanding of markets", "Experience with trading platforms", "Adequate trading capital", "Computer with fast internet", "Multiple monitors recommended"]',
  '["Master day trading strategies", "Execute trades efficiently", "Manage trading psychology", "Use advanced tools", "Understand market microstructure", "Develop disciplined approach"]'
);

-- Insert lessons for Stock Market Fundamentals
INSERT INTO public.lessons (course_id, title, duration, video_url, is_preview, order_index) VALUES
('c1e9e7a0-8b7c-4d5e-9f2a-1b3c4d5e6f7a', 'Introduction to Stock Markets', '15:30', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', true, 1),
('c1e9e7a0-8b7c-4d5e-9f2a-1b3c4d5e6f7a', 'Understanding Stock Prices', '22:15', null, false, 2),
('c1e9e7a0-8b7c-4d5e-9f2a-1b3c4d5e6f7a', 'Types of Stocks', '18:45', null, false, 3),
('c1e9e7a0-8b7c-4d5e-9f2a-1b3c4d5e6f7a', 'Reading Stock Charts', '25:30', null, false, 4),
('c1e9e7a0-8b7c-4d5e-9f2a-1b3c4d5e6f7a', 'Market Orders vs Limit Orders', '20:00', null, false, 5),
('c1e9e7a0-8b7c-4d5e-9f2a-1b3c4d5e6f7a', 'Risk Management Basics', '28:15', null, false, 6);

-- Insert sample lessons for other courses
INSERT INTO public.lessons (course_id, title, duration, video_url, is_preview, order_index) VALUES
('c2e9e7a0-8b7c-4d5e-9f2a-1b3c4d5e6f7b', 'Introduction to Technical Analysis', '12:00', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', true, 1),
('c2e9e7a0-8b7c-4d5e-9f2a-1b3c4d5e6f7b', 'Chart Patterns and Trends', '25:30', null, false, 2),
('c2e9e7a0-8b7c-4d5e-9f2a-1b3c4d5e6f7b', 'Technical Indicators Overview', '20:15', null, false, 3);

INSERT INTO public.lessons (course_id, title, duration, video_url, is_preview, order_index) VALUES
('c3e9e7a0-8b7c-4d5e-9f2a-1b3c4d5e6f7c', 'Options Trading Basics', '18:00', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', true, 1),
('c3e9e7a0-8b7c-4d5e-9f2a-1b3c4d5e6f7c', 'Understanding Options Greeks', '30:45', null, false, 2),
('c3e9e7a0-8b7c-4d5e-9f2a-1b3c4d5e6f7c', 'Advanced Options Strategies', '35:20', null, false, 3);

