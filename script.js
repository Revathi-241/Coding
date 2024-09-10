document.addEventListener("DOMContentLoaded", () => {
    const addTaskBtn = document.getElementById("add-task-btn");
    const taskInput = document.getElementById("task-input");
    const deadlineDateInput = document.getElementById("deadline-date-input");
    const deadlineTimeInput = document.getElementById("deadline-time-input");
    const amPmInput = document.getElementById("am-pm-input");
    const taskList = document.getElementById("task-list");

    addTaskBtn.addEventListener("click", addTask);
    // Load tasks from localStorage
    loadTasks();
    // Check for overdue tasks on load
    checkOverdueTasks();

    function addTask() {
        const taskText = taskInput.value.trim();
        const taskDeadlineDate = deadlineDateInput.value;
        const taskDeadlineTime = deadlineTimeInput.value;
        const taskAmPm = amPmInput.value;

        if (taskText === "" || taskDeadlineDate === "" || taskDeadlineTime === "" || taskAmPm === "") {
            alert("Please enter a task, deadline date, deadline time, and select AM/PM.");
            return;
        }

        const taskItem = createTaskItem(taskText, taskDeadlineDate, taskDeadlineTime, taskAmPm);
        taskList.appendChild(taskItem);
        saveTasks();
        startReminder(taskItem, taskText, taskDeadlineDate, taskDeadlineTime, taskAmPm);

        taskInput.value = "";
        deadlineDateInput.value = "";
        deadlineTimeInput.value = "";
        amPmInput.value = "";
    }

    function createTaskItem(taskText, taskDeadlineDate, taskDeadlineTime, taskAmPm) {
        const taskItem = document.createElement("li");
        const taskSpan = document.createElement("span");
        taskSpan.textContent = `${taskText} (Due: ${taskDeadlineDate} ${formatTime(taskDeadlineTime, taskAmPm)})`;

        const completeBtn = document.createElement("button");
        completeBtn.innerHTML = "&#10003;";
        completeBtn.className = "complete-btn";
        completeBtn.addEventListener("click", () => {
            taskSpan.classList.toggle("completed");
            saveTasks();
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.innerHTML = "&#10005;";
        deleteBtn.className = "delete-btn";
        deleteBtn.addEventListener("click", () => {
            taskList.removeChild(taskItem);
            saveTasks();
        });

        const editBtn = document.createElement("button");
        editBtn.innerHTML = "&#9998;"; // Edit icon
        editBtn.className = "edit-btn";
        editBtn.addEventListener("click", () => {
            editTask(taskItem, taskSpan, taskText, taskDeadlineDate, taskDeadlineTime, taskAmPm);
        });

        taskItem.appendChild(taskSpan);
        taskItem.appendChild(completeBtn);
        taskItem.appendChild(editBtn);
        taskItem.appendChild(deleteBtn);

        return taskItem;
    }

    function formatTime(time, amPm) {
        const [hour, minute] = time.split(":");
        const formattedHour = hour % 12 || 12;
        const formattedMinute = minute.padStart(2, "0");
        return `${formattedHour}:${formattedMinute} ${amPm}`;
    }

    function editTask(taskItem, taskSpan, oldText, oldDate, oldTime, oldAmPm) {
        const newText = prompt("Edit task:", oldText);
        const newDate = prompt("Edit deadline date (YYYY-MM-DD):", oldDate);
        const newTime = prompt("Edit deadline time (HH:MM):", oldTime);
        const newAmPm = prompt("Edit AM/PM (AM/PM):", oldAmPm);

        if (newText && newDate && newTime && newAmPm) {
            taskSpan.textContent = `${newText} (Due: ${newDate} ${formatTime(newTime, newAmPm)})`;
            saveTasks();
        }
    }

    function startReminder(taskItem, taskText, deadlineDate, deadlineTime, amPm) {
        const reminderInterval = setInterval(() => {
            const isCompleted = taskItem.querySelector("span").classList.contains("completed");
            if (isCompleted) {
                clearInterval(reminderInterval);
                return;
            }

            const now = new Date();
            const deadline = new Date(`${deadlineDate}T${convertTo24Hour(deadlineTime, amPm)}`);
            const timeDifference = deadline.getTime() - now.getTime();

            if (timeDifference <= 0) {
                const delay = Math.abs(timeDifference);
                const delayMinutes = Math.floor((delay / (1000 * 60)) % 60);
                const delayHours = Math.floor((delay / (1000 * 60 * 60)) % 24);
                const delayDays = Math.floor(delay / (1000 * 60 * 60 * 24));
                const delayedTasksCount = countDelayedTasks();

                let delayMessage = `Reminder: ${taskText} is due now!`;
                if (delayDays > 0) {
                    delayMessage += ` It is delayed by ${delayDays} days, ${delayHours} hours, and ${delayMinutes} minutes.`;
                } else if (delayHours > 0) {
                    delayMessage += ` It is delayed by ${delayHours} hours and ${delayMinutes} minutes.`;
                } else {
                    delayMessage += ` It is delayed by ${delayMinutes} minutes.`;
                }

                delayMessage += ` There are ${delayedTasksCount} delayed tasks.`;
                alert(delayMessage);
            }
        }, 120000); // Check every 2 minutes (120000 milliseconds)
    }

    function convertTo24Hour(time, amPm) {
        let [hour, minute] = time.split(":");
        hour = parseInt(hour);

        if (amPm === "PM" && hour < 12) {
            hour += 12;
        }
        if (amPm === "AM" && hour === 12) {
            hour = 0;
        }

        return `${hour.toString().padStart(2, "0")}:${minute}`;
    }

    function saveTasks() {
        const tasks = [];
        document.querySelectorAll("#task-list li").forEach(taskItem => {
            const taskSpan = taskItem.querySelector("span").textContent;
            const isCompleted = taskItem.querySelector("span").classList.contains("completed");

            const taskTextMatch = taskSpan.match(/^(.*) \(Due: (\d{4}-\d{2}-\d{2}) (\d{1,2}:\d{2} (AM|PM))\)$/);
            if (taskTextMatch) {
                const taskText = taskTextMatch[1];
                const taskDeadlineDate = taskTextMatch[2];
                const taskDeadlineTime = taskTextMatch[3].split(" ")[0];
                const taskAmPm = taskTextMatch[3].split(" ")[1];

                tasks.push({ text: taskText, completed: isCompleted, deadlineDate: taskDeadlineDate, deadlineTime: taskDeadlineTime, amPm: taskAmPm });
            }
        });

        localStorage.setItem("tasks", JSON.stringify(tasks));
    }

    function loadTasks() {
        const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
        tasks.forEach(task => {
            const taskItem = createTaskItem(task.text, task.deadlineDate, task.deadlineTime, task.amPm);
            if (task.completed) {
                taskItem.querySelector("span").classList.add("completed");
            }
            taskList.appendChild(taskItem);
            startReminder(taskItem, task.text, task.deadlineDate, task.deadlineTime, task.amPm);
        });
    }

    function countDelayedTasks() {
        let delayedTasksCount = 0;
        document.querySelectorAll("#task-list li span:not(.completed)").forEach(taskSpan => {
            const taskTextMatch = taskSpan.textContent.match(/^(.*) \(Due: (\d{4}-\d{2}-\d{2}) (\d{1,2}:\d{2} (AM|PM))\)$/);
            if (taskTextMatch) {
                const taskDeadlineDate = taskTextMatch[2];
                const taskDeadlineTime = taskTextMatch[3].split(" ")[0];
                const taskAmPm = taskTextMatch[3].split(" ")[1];

                const now = new Date();
                const deadline = new Date(`${taskDeadlineDate}T${convertTo24Hour(taskDeadlineTime, taskAmPm)}`);
                const timeDifference = deadline.getTime() - now.getTime();

                if (timeDifference <= 0) {
                    delayedTasksCount++;
                }
            }
        });

        return delayedTasksCount;
    }

    function checkOverdueTasks() {
        document.querySelectorAll("#task-list li").forEach(taskItem => {
            const taskSpan = taskItem.querySelector("span");
            const isCompleted = taskSpan.classList.contains("completed");

            if (!isCompleted) {
                const taskTextMatch = taskSpan.textContent.match(/^(.*) \(Due: (\d{4}-\d{2}-\d{2}) (\d{1,2}:\d{2} (AM|PM))\)$/);
                if (taskTextMatch) {
                    const taskText = taskTextMatch[1];
                    const taskDeadlineDate = taskTextMatch[2];
                    const taskDeadlineTime = taskTextMatch[3].split(" ")[0];
                    const taskAmPm = taskTextMatch[3].split(" ")[1];

                    const now = new Date();
                    const deadline = new Date(`${taskDeadlineDate}T${convertTo24Hour(taskDeadlineTime, taskAmPm)}`);
                    const timeDifference = deadline.getTime() - now.getTime();

                    if (timeDifference <= 0) {
                        const delay = Math.abs(timeDifference);
                        const delayMinutes = Math.floor((delay / (1000 * 60)) % 60);
                        const delayHours = Math.floor((delay / (1000 * 60 * 60)) % 24);
                        const delayDays = Math.floor(delay / (1000 * 60 * 60 * 24));

                        let delayMessage = `Reminder: ${taskText} is due now!`;
                        if (delayDays > 0) {
                            delayMessage += ` It is delayed by ${delayDays} days, ${delayHours} hours, and ${delayMinutes} minutes.`;
                        } else if (delayHours > 0) {
                            delayMessage += ` It is delayed by ${delayHours} hours and ${delayMinutes} minutes.`;
                        } else {
                            delayMessage += ` It is delayed by ${delayMinutes} minutes.`;
                        }
                        alert(delayMessage);
                    }
                }
            }
        });
    }
});
