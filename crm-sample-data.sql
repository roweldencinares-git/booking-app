-- Rowel CRM — Sample Data
-- Run in Supabase SQL Editor AFTER crm-schema.sql

-- Companies
insert into crm_companies (id, name, website, industry, size) values
  ('a1000000-0000-0000-0000-000000000001', 'Apex Growth Group',    'apexgrowth.com',    'Consulting',    '11-50'),
  ('a1000000-0000-0000-0000-000000000002', 'Momentum Ventures',    'momentumvc.com',    'Finance',       '51-200'),
  ('a1000000-0000-0000-0000-000000000003', 'Clarity Health Co.',   'clarityhealth.com', 'Healthcare',    '1-10');

-- Contacts
insert into crm_contacts (id, first_name, last_name, email, phone, company_id, type, status, tags, notes) values
  ('b1000000-0000-0000-0000-000000000001', 'Marcus',  'Chen',     'marcus.chen@apexgrowth.com',    '+1 416-555-0101', 'a1000000-0000-0000-0000-000000000001', 'customer', 'active', '{"vip","executive-coaching"}',      'CEO. Referred by LinkedIn. Completed 6-month program.'),
  ('b1000000-0000-0000-0000-000000000002', 'Sofia',   'Reyes',    'sofia.reyes@momentumvc.com',    '+1 416-555-0102', 'a1000000-0000-0000-0000-000000000002', 'lead',     'active', '{"leadership","follow-up"}',         'VP Operations. Interested in team coaching package.'),
  ('b1000000-0000-0000-0000-000000000003', 'James',   'Okafor',   'james.okafor@clarityhealth.com','+1 416-555-0103', 'a1000000-0000-0000-0000-000000000003', 'lead',     'active', '{"burnout","wellness"}',             'Founder. Struggling with work-life balance post-funding round.'),
  ('b1000000-0000-0000-0000-000000000004', 'Priya',   'Sharma',   'priya.sharma@gmail.com',        '+1 416-555-0104', null,                                   'customer', 'active', '{"mindset","1-on-1"}',              'Independent consultant. 3rd session this month.'),
  ('b1000000-0000-0000-0000-000000000005', 'Ethan',   'Wright',   'ethan.wright@apexgrowth.com',   '+1 416-555-0105', 'a1000000-0000-0000-0000-000000000001', 'lead',     'active', '{"career-transition"}',              'Director level. Exploring exec transition coaching.'),
  ('b1000000-0000-0000-0000-000000000006', 'Amara',   'Diallo',   'amara.diallo@gmail.com',        '+1 416-555-0106', null,                                   'partner',  'active', '{"referral-partner","wellness"}',    'Life coach. Cross-refers clients regularly.'),
  ('b1000000-0000-0000-0000-000000000007', 'Lucas',   'Fontaine', 'lucas.fontaine@momentumvc.com', '+1 416-555-0107', 'a1000000-0000-0000-0000-000000000002', 'lead',     'active', '{"team-coaching","new"}',            'COO. Referred by Sofia. Initial discovery call booked.');

-- Deals
insert into crm_deals (id, title, value, stage, contact_id, company_id, close_date, description) values
  ('c1000000-0000-0000-0000-000000000001', 'Marcus — Renewal Q3',          4800.00, 'proposal',     'b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', now() + interval '21 days',  'Annual renewal for executive 1-on-1 coaching. 12 sessions.'),
  ('c1000000-0000-0000-0000-000000000002', 'Momentum — Team Package',      9600.00, 'negotiation',  'b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', now() + interval '14 days',  'Group coaching for leadership team. 8 people x 6 sessions.'),
  ('c1000000-0000-0000-0000-000000000003', 'James — Founder Clarity',      3200.00, 'qualified',    'b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', now() + interval '30 days',  '8-session burnout recovery & clarity program.'),
  ('c1000000-0000-0000-0000-000000000004', 'Priya — Mindset Intensive',    2400.00, 'won',          'b1000000-0000-0000-0000-000000000004', null,                                   now() - interval '5 days',   'Signed. 6-session intensive. Deposit received.'),
  ('c1000000-0000-0000-0000-000000000005', 'Ethan — Career Transition',    1800.00, 'lead',         'b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001', now() + interval '45 days',  'Discovery call completed. Sending proposal this week.'),
  ('c1000000-0000-0000-0000-000000000006', 'Lucas — Team Coaching Intro',  9600.00, 'lead',         'b1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000002', now() + interval '60 days',  'New referral from Sofia. First call scheduled.');

-- Activities
insert into crm_activities (type, content, contact_id, deal_id, created_at) values
  ('call',    'Discovery call — Marcus confirmed interest in renewal. Prefers same schedule.', 'b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', now() - interval '3 days'),
  ('email',   '**To:** marcus.chen@apexgrowth.com\n**Subject:** Q3 Renewal Proposal\n\nHi Marcus, great speaking with you. Attaching the renewal proposal for your review.', 'b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', now() - interval '2 days'),
  ('meeting', 'Zoom call with Sofia. Walked through team package structure. She needs board approval before signing.', 'b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002', now() - interval '5 days'),
  ('note',    'Sofia mentioned budget approval happens monthly — next window is end of this month. Follow up June 28.', 'b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002', now() - interval '5 days'),
  ('call',    'James intro call. Very engaged. Clear pain: 80-hr weeks, team conflict post-Series A. Sending program outline.', 'b1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000003', now() - interval '7 days'),
  ('email',   '**To:** james.okafor@clarityhealth.com\n**Subject:** Founder Clarity Program — Overview\n\nHi James, as discussed here is the outline for the 8-session program.', 'b1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000003', now() - interval '6 days'),
  ('note',    'Priya signed! Deposit paid via Stripe. First session July 1. Calendar invite sent.', 'b1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000004', now() - interval '5 days'),
  ('meeting', 'Session 1 with Priya. Identified 3 core limiting beliefs. Assigned reflection exercise.', 'b1000000-0000-0000-0000-000000000004', null, now() - interval '2 days'),
  ('call',    'Amara check-in. She referred two clients this quarter — send thank-you gift.', 'b1000000-0000-0000-0000-000000000006', null, now() - interval '1 day');

-- Tasks
insert into crm_tasks (title, due_date, priority, completed, contact_id, deal_id) values
  ('Send Marcus renewal contract',         now() + interval '1 day',  'high',   false, 'b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001'),
  ('Follow up with Sofia on board approval', now() + interval '3 days', 'high', false, 'b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002'),
  ('Send James program proposal PDF',      now() + interval '1 day',  'high',   false, 'b1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000003'),
  ('Prepare session 2 materials for Priya', now() + interval '5 days', 'medium', false, 'b1000000-0000-0000-0000-000000000004', null),
  ('Send Ethan career coaching proposal',  now() + interval '2 days', 'medium', false, 'b1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000005'),
  ('Book discovery call with Lucas',       now() + interval '4 days', 'medium', false, 'b1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000006'),
  ('Send Amara referral thank-you gift',   now() + interval '3 days', 'low',    false, 'b1000000-0000-0000-0000-000000000006', null),
  ('Update session notes for Priya',       now() - interval '1 day',  'medium', true,  'b1000000-0000-0000-0000-000000000004', null);
