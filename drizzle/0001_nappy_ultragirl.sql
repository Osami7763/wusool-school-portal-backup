CREATE TABLE `assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subjectId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`description` text,
	`dueDate` varchar(10) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lessons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subjectId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`lessonDate` varchar(10) NOT NULL,
	`page` varchar(80),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lessons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `schedule` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dayOfWeek` int NOT NULL,
	`period` int NOT NULL,
	`subjectId` int NOT NULL,
	`startTime` varchar(10) NOT NULL,
	`endTime` varchar(10) NOT NULL,
	`room` varchar(80),
	CONSTRAINT `schedule_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subjects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`color` varchar(24) NOT NULL DEFAULT 'teal',
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `subjects_id` PRIMARY KEY(`id`)
);
