CREATE TABLE `applications` (
	`id` text PRIMARY KEY NOT NULL,
	`reference` text NOT NULL,
	`customer_id` text,
	`vessel_id` text,
	`service_id` text,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`draft_payload` text DEFAULT '{}' NOT NULL,
	`pricing_snapshot` text,
	`consent_at` text,
	`consent_version` text,
	`submitted_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`version` integer DEFAULT 0 NOT NULL,
	`last_actor_id` text,
	`last_public_message` text,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`vessel_id`) REFERENCES `vessels`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`last_actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `applications_reference_unique` ON `applications` (`reference`);--> statement-breakpoint
CREATE INDEX `idx_app_status_submitted` ON `applications` (`status`,`submitted_at`);--> statement-breakpoint
CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text DEFAULT 'INDIVIDUAL' NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`address` text NOT NULL,
	`city` text NOT NULL,
	`postal_code` text NOT NULL,
	`country` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `application_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`application_id` text NOT NULL,
	`public_id` text NOT NULL,
	`type` text NOT NULL,
	`original_filename` text NOT NULL,
	`storage_key` text NOT NULL,
	`mime_type` text NOT NULL,
	`file_size` integer NOT NULL,
	`sha256` text NOT NULL,
	`uploaded_at` text NOT NULL,
	FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `application_documents_public_id_unique` ON `application_documents` (`public_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `application_documents_storage_key_unique` ON `application_documents` (`storage_key`);--> statement-breakpoint
CREATE INDEX `idx_documents_application` ON `application_documents` (`application_id`);--> statement-breakpoint
CREATE TABLE `application_status_history` (
	`id` text PRIMARY KEY NOT NULL,
	`application_id` text NOT NULL,
	`from_status` text,
	`to_status` text NOT NULL,
	`actor_id` text,
	`public_message` text,
	`created_at` text NOT NULL,
	`version` integer NOT NULL,
	FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_history_application_version` ON `application_status_history` (`application_id`,`version`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`application_id` text NOT NULL,
	`kind` text NOT NULL,
	`channel` text DEFAULT 'ADMIN_INBOX' NOT NULL,
	`created_at` text NOT NULL,
	`read_at` text,
	FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_notifications_unread` ON `notifications` (`read_at`);--> statement-breakpoint
CREATE TABLE `pricing_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`service_id` text NOT NULL,
	`amount_minor` integer NOT NULL,
	`currency` text NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pricing_rules_service_id_unique` ON `pricing_rules` (`service_id`);--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `service_options` (
	`id` text PRIMARY KEY NOT NULL,
	`service_id` text NOT NULL,
	`name` text NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`active` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `draft_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`application_id` text NOT NULL,
	`expires_at` text NOT NULL,
	FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`identity_id` text NOT NULL,
	`email` text NOT NULL,
	`role` text DEFAULT 'ADMIN' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_identity_id_unique` ON `users` (`identity_id`);--> statement-breakpoint
CREATE TABLE `vessels` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`builder` text,
	`model` text,
	`build_year` integer,
	`identification` text,
	`length` real NOT NULL,
	`current_flag` text,
	`intended_use` text NOT NULL
);
