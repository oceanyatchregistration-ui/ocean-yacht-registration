CREATE TABLE `reference_sequences` (
  `name` text PRIMARY KEY NOT NULL,
  `next_value` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `reference_sequences`(`name`,`next_value`) VALUES('customer_tracking',990);
