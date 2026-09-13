CREATE TABLE `laptops` (
	`id` int AUTO_INCREMENT NOT NULL,
	`brand` varchar(80) NOT NULL,
	`model` varchar(160) NOT NULL,
	`slug` varchar(180) NOT NULL,
	`price` int NOT NULL,
	`currency` enum('INR','USD') NOT NULL DEFAULT 'INR',
	`cpu` varchar(180) NOT NULL,
	`gpu` varchar(180) NOT NULL,
	`ram` int NOT NULL,
	`storage` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `laptops_id` PRIMARY KEY(`id`),
	CONSTRAINT `laptops_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `recommendationRequests` (
	`id` varchar(32) NOT NULL,
	`requirements` json NOT NULL,
	`inputMode` enum('form','natural-language') NOT NULL DEFAULT 'form',
	`scoringVersion` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `recommendationRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recommendationResults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestId` varchar(32) NOT NULL,
	`laptopId` int NOT NULL,
	`rank` int NOT NULL,
	`score` int NOT NULL,
	`evidence` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `recommendationResults_id` PRIMARY KEY(`id`)
);
