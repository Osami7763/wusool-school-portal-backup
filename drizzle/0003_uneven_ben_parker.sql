CREATE TABLE `academicItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subjectId` int NOT NULL,
	`kind` enum('exam','research') NOT NULL,
	`title` varchar(180) NOT NULL,
	`description` text,
	`dueDate` varchar(10) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `academicItems_id` PRIMARY KEY(`id`)
);
