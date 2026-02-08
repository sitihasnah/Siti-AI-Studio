
import { Question } from './types';

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;
export const GRAVITY = 0.35; 
export const JUMP_FORCE = -11.0; 
export const MAX_SPEED = 4.8; 
export const ACCELERATION = 0.45; 
export const FRICTION = 0.9; 

export const COLORS = {
  GRYFFINDOR_RED: '#740001',
  GRYFFINDOR_GOLD: '#D3A625',
  SKY: '#020210',
  PLATFORM: '#3d3d3d',
  STAR: '#fff176',
  DEMENTOR: '#2c3e50',
};

export const TECHNICAL_REFERENCE = {
  connection: '<?php\n$conn = mysqli_connect($servername, $username, $password, $dbname);\n\nif (!$conn) {\n    die("Connection failed: " . mysqli_connect_error());\n}\n?>',
  looping: '<?php\n$result = mysqli_query($conn, $sql);\n\nwhile($row = mysqli_fetch_assoc($result)) {\n    echo "Star Count: " . $row["stars"];\n}\n?>',
  commands: [
    { cmd: "SELECT", desc: "Retrieve data from tables" },
    { cmd: "INSERT INTO", desc: "Add new records" },
    { cmd: "UPDATE", desc: "Modify existing data" },
    { cmd: "DELETE FROM", desc: "Remove records" },
    { cmd: "CREATE DATABASE", desc: "Make a new DB" },
    { cmd: "DROP DATABASE", desc: "Delete a DB" }
  ],
  history: "MySQL is named after 'My', the daughter of co-founder Monty Widenius."
};

export const QUIZ_DATA: Question[] = [
  {
    id: 1,
    question: "Who was MySQL named after, following its co-founder Monty Widenius?",
    options: ["His wife, MySQLa", "His daughter, My", "His son, SQL", "His pet owl, Hedwig"],
    answer: 1
  },
  {
    id: 2,
    question: "Which SQL command is used to retrieve data from a database?",
    options: ["INSERT INTO", "UPDATE", "SELECT", "DELETE FROM"],
    answer: 2
  },
  {
    id: 3,
    question: "What is the correct PHP loop to iterate through a mysqli recordset?",
    options: ["for each ($row in $result)", "while ($row = mysqli_fetch_assoc($result))", "loop ($result as $row)", "mysqli_repeat($result)"],
    answer: 1
  },
  {
    id: 4,
    question: "Which procedural function is used to establish a connection in PHP?",
    options: ["mysqli_connect()", "db_open()", "new MySQLi()", "pdo_connect()"],
    answer: 0
  },
  {
    id: 5,
    question: "Which command would you use to remove a specific record from a table?",
    options: ["DROP RECORD", "DELETE FROM", "REMOVE", "ERASE"],
    answer: 1
  },
  {
    id: 6,
    question: "How do you check if a mysqli connection failed in procedural style?",
    options: ["if ($conn->error)", "if (!mysqli_error($conn))", "if (!$conn) { die('Connection failed: ' . mysqli_connect_error()); }", "try { connect() }"],
    answer: 2
  }
];

export const LEVEL_LAYOUT = {
  platforms: [
    { x: 0, y: 550, width: 3500, height: 100, type: 'stone' },
    { x: 280, y: 460, width: 220, height: 35, type: 'stone' },
    { x: 550, y: 350, width: 180, height: 35, type: 'stone' },
    { x: 820, y: 440, width: 220, height: 35, type: 'stone' },
    { x: 1100, y: 320, width: 250, height: 35, type: 'stone' },
    { x: 1450, y: 420, width: 200, height: 35, type: 'stone' },
    { x: 1750, y: 300, width: 140, height: 35, type: 'stone' },
    { x: 2100, y: 420, width: 180, height: 35, type: 'stone' },
    { x: 2450, y: 550, width: 100, height: 500, type: 'stone' },
  ],
  stars: [
    { x: 350, y: 410 },
    { x: 600, y: 300 },
    { x: 900, y: 390 },
    { x: 450, y: 130 },
    { x: 1200, y: 270 },
    { x: 1400, y: 100 },
    { x: 1800, y: 250 },
    { x: 2200, y: 370 },
  ],
  snitch: { x: 2400, y: 300 },
  enemies: [
    { x: 800, y: 500, range: 300 },
    { x: 1500, y: 500, range: 450 },
    { x: 1050, y: 270, range: 180 },
    { x: 1900, y: 480, range: 350 },
  ]
};
