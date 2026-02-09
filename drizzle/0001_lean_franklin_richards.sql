PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`password_hash` text,
	`google_id` text,
	`role` text DEFAULT 'rep' NOT NULL,
	`avatar_url` text,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "email", "name", "password_hash", "google_id", "role", "avatar_url", "created_at", "updated_at") SELECT "id", "email", "name", "password_hash", "google_id", "role", "avatar_url", "created_at", "updated_at" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
ALTER TABLE `activities` ADD `duration` integer;--> statement-breakpoint
ALTER TABLE `activities` ADD `file_url` text;--> statement-breakpoint
ALTER TABLE `activities` ADD `status` text;--> statement-breakpoint
ALTER TABLE `activities` ADD `pic` text;--> statement-breakpoint
ALTER TABLE `activities` ADD `due_date` text;--> statement-breakpoint
ALTER TABLE `opportunities` ADD `lead_source` text;--> statement-breakpoint
ALTER TABLE `opportunities` ADD `partner_pic` text;--> statement-breakpoint
ALTER TABLE `opportunities` ADD `authority_name` text;--> statement-breakpoint
ALTER TABLE `opportunities` ADD `authority_contact` text;--> statement-breakpoint
ALTER TABLE `opportunities` ADD `authority_email` text;--> statement-breakpoint
ALTER TABLE `opportunities` ADD `champion_name` text;--> statement-breakpoint
ALTER TABLE `opportunities` ADD `champion_contact` text;--> statement-breakpoint
ALTER TABLE `opportunities` ADD `champion_email` text;--> statement-breakpoint
ALTER TABLE `opportunities` ADD `engagement_team` text;--> statement-breakpoint
ALTER TABLE `opportunities` ADD `documents_folder` text;--> statement-breakpoint
ALTER TABLE `opportunities` ADD `immediate_next_step` text;--> statement-breakpoint
ALTER TABLE `opportunities` ADD `timeline` text;--> statement-breakpoint
ALTER TABLE `opportunities` ADD `objectives` text;--> statement-breakpoint
ALTER TABLE `opportunities` ADD `key_pain_points` text;--> statement-breakpoint
ALTER TABLE `opportunities` ADD `initiatives` text;--> statement-breakpoint
ALTER TABLE `opportunities` ADD `potential_roadblocks` text;--> statement-breakpoint
ALTER TABLE `opportunities` ADD `engagement_summary` text;