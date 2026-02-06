CREATE TABLE `world_presets` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`system_prompt` text DEFAULT '' NOT NULL,
	`post_history_instructions` text DEFAULT '' NOT NULL,
	`formatting_order` text DEFAULT '["system_prompt","world_lore","description","personality","scenario","lorebook_before","message_example","messages","lorebook_after","post_history_instructions"]' NOT NULL,
	`default_provider` text,
	`default_model` text,
	`temperature` real DEFAULT 0.8 NOT NULL,
	`max_tokens` integer DEFAULT 4096 NOT NULL,
	`max_context` integer DEFAULT 128000 NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `chats` ADD `world_preset_id` text REFERENCES world_presets(id);--> statement-breakpoint
ALTER TABLE `lorebooks` ADD `world_preset_id` text REFERENCES world_presets(id);