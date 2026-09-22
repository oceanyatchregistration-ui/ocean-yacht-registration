CREATE TABLE `reviews` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `country` text,
  `rating` integer NOT NULL,
  `comment` text NOT NULL,
  `status` text DEFAULT 'PENDING' NOT NULL,
  `created_at` text NOT NULL,
  `published_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_reviews_status_created` ON `reviews` (`status`,`created_at`);
