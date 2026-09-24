CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorUserId` int NOT NULL,
	`actorName` varchar(180) NOT NULL,
	`action` enum('updated','replaced','removed') NOT NULL,
	`entityType` enum('assignment','lesson','exam','research') NOT NULL,
	`entityId` int NOT NULL,
	`details` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
