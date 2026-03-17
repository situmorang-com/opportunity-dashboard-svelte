CREATE TABLE `client_contacts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`client_id` integer NOT NULL,
	`name` text NOT NULL,
	`title` text,
	`email` text,
	`phone` text,
	`role` text DEFAULT 'other',
	`is_primary` integer DEFAULT false,
	`notes` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `contact_activities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`contact_id` integer NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`outcome` text,
	`activity_date` text NOT NULL,
	`duration` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`contact_id`) REFERENCES `client_contacts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `discovery_assessments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`opportunity_id` integer NOT NULL,
	`current_infrastructure` text,
	`data_sources` text,
	`integration_points` text,
	`security_requirements` text,
	`compliance_needs` text,
	`technical_readiness` integer,
	`business_objective` text,
	`expected_roi` text,
	`success_metrics` text,
	`budget_range` text,
	`budget_approved` integer DEFAULT false,
	`stakeholder_alignment` text,
	`deliverables` text,
	`out_of_scope` text,
	`assumptions` text,
	`constraints` text,
	`risks` text,
	`required_skills` text,
	`team_size` text,
	`external_resources` text,
	`checklist` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`opportunity_id`) REFERENCES `opportunities`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `discovery_assessments_opportunity_id_unique` ON `discovery_assessments` (`opportunity_id`);--> statement-breakpoint
CREATE TABLE `worklist_actions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`item_id` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`snoozed_until` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `worklist_actions_user_item_unique` ON `worklist_actions` (`user_id`,`item_id`);--> statement-breakpoint
ALTER TABLE `opportunities` ADD `partner_org` text;--> statement-breakpoint
ALTER TABLE `opportunities` ADD `microsoft_seller_name` text;--> statement-breakpoint
ALTER TABLE `opportunities` ADD `microsoft_seller_email` text;--> statement-breakpoint
ALTER TABLE `opportunities` ADD `co_sell_status` text;--> statement-breakpoint
ALTER TABLE `opportunities` ADD `funding_status` text;--> statement-breakpoint
ALTER TABLE `opportunities` ADD `co_sell_notes` text;--> statement-breakpoint
ALTER TABLE `opportunities` ADD `authority_title` text;--> statement-breakpoint
ALTER TABLE `opportunities` ADD `champion_title` text;