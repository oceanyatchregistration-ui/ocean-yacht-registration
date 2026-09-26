ALTER TABLE `users` ADD `provider` text DEFAULT 'local' NOT NULL;
--> statement-breakpoint
ALTER TABLE `users` ADD `last_login_at` text;
--> statement-breakpoint
ALTER TABLE `users` ADD `login_count` integer DEFAULT 0 NOT NULL;
