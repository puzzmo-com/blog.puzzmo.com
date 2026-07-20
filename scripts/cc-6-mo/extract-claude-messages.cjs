#!/usr/bin/env node

// Run: node scripts/cc-6-mo/extract-claude-messages.cjs

const fs = require("fs")
const path = require("path")
const os = require("os")

const projectsDirs = [
  path.join(os.homedir(), ".claude", "projects"),
  "/home/orta/dev/puzmo/scripts/claude-config/Users/orta/.claude/projects",
]

const historyFiles = [
  path.join(os.homedir(), ".claude", "history.jsonl"),
  "/home/orta/dev/puzmo/scripts/claude-config/Users/orta/.claude/history.jsonl",
]
const outputFile = path.join(
  __dirname,
  "..",
  "..",
  "content",
  "posts",
  "2025",
  "12",
  "14",
  "six-months-of-claude",
  "chat-messages",
  "chat-messages.json"
)

function redactSensitiveContent(text) {
  // Redact Discord webhook URLs
  text = text.replace(/https:\/\/discord\.com\/api\/webhooks\/\d+\/[A-Za-z0-9_-]+/g, "https://discord.com/api/webhooks/[REDACTED]")

  // Redact Render SSH hostnames
  text = text.replace(/srv-[a-z0-9]+@ssh\.[a-z]+\.render\.com/g, "[REDACTED]@ssh.render.com")

  return text
}

function extractProjectName(folderName) {
  // Convert folder name like "-home-orta-dev-puzmo-app" to a readable project name
  // Remove leading dash and replace dashes with slashes to reconstruct path
  const pathParts = folderName.replace(/^-/, "").split("-")

  // Find the meaningful project name (usually the last few parts)
  // Skip common prefixes like home, username, dev
  const meaningfulParts = []
  let foundMeaningful = false

  for (const part of pathParts) {
    if (foundMeaningful || !["home", "orta", "dev", "oss"].includes(part)) {
      foundMeaningful = true
      meaningfulParts.push(part)
    }
  }

  return meaningfulParts.join("/") || folderName
}

function extractTextFromContent(content) {
  if (!Array.isArray(content)) return null

  const textParts = []
  for (const item of content) {
    // Handle object format: { type: 'text', text: '...' }
    if (item && typeof item === "object" && item.type === "text" && item.text) {
      // Skip IDE context messages
      if (item.text.startsWith("<ide_opened_file>")) continue
      if (item.text.startsWith("<ide_selection>")) continue
      textParts.push(item.text)
    }
    // Handle plain string format (older format)
    else if (typeof item === "string") {
      // Skip IDE context messages
      if (item.startsWith("<ide_opened_file>")) continue
      if (item.startsWith("<ide_selection>")) continue
      textParts.push(item)
    }
  }

  return textParts.length > 0 ? textParts.join("\n") : null
}

function processJsonlFile(filePath, projectName) {
  const messages = []

  try {
    const content = fs.readFileSync(filePath, "utf-8")
    const lines = content.split("\n").filter((line) => line.trim())

    for (const line of lines) {
      try {
        const entry = JSON.parse(line)

        // Only process user messages (not assistant, tool results, etc.)
        if (entry.type === "user" && entry.message?.role === "user") {
          const text = extractTextFromContent(entry.message.content)

          if (text && text.trim()) {
            // Skip messages containing certain phrases
            if (text.includes("SSR Response") || text.includes("know how many plays")) {
              continue
            }

            messages.push({
              date: entry.timestamp || null,
              message: redactSensitiveContent(text.trim()),
              project: projectName,
            })
          }
        }
      } catch (parseError) {
        // Skip malformed lines
      }
    }
  } catch (readError) {
    console.error(`Error reading ${filePath}: ${readError.message}`)
  }

  return messages
}

function main() {
  const allMessages = []

  for (const projectsDir of projectsDirs) {
    if (!fs.existsSync(projectsDir)) {
      console.log(`Skipping non-existent directory: ${projectsDir}`)
      continue
    }

    const projectFolders = fs.readdirSync(projectsDir)

    for (const folder of projectFolders) {
      const folderPath = path.join(projectsDir, folder)

      if (!fs.statSync(folderPath).isDirectory()) continue

      const projectName = extractProjectName(folder)
      const jsonlFiles = fs.readdirSync(folderPath).filter((f) => f.endsWith(".jsonl"))

      for (const jsonlFile of jsonlFiles) {
        const filePath = path.join(folderPath, jsonlFile)
        const messages = processJsonlFile(filePath, projectName)
        allMessages.push(...messages)
      }
    }
  }

  // Also process history.jsonl files (command history)
  for (const historyFile of historyFiles) {
    if (!fs.existsSync(historyFile)) {
      console.log(`Skipping non-existent history file: ${historyFile}`)
      continue
    }

    try {
      const content = fs.readFileSync(historyFile, "utf-8")
      const lines = content.split("\n").filter((line) => line.trim())

      for (const line of lines) {
        try {
          const entry = JSON.parse(line)
          if (entry.display && entry.timestamp) {
            const text = entry.display.trim()

            // Skip messages containing certain phrases
            if (text.includes("SSR Response") || text.includes("know how many plays")) {
              continue
            }

            // Extract project name from path
            const projectPath = entry.project || ""
            const projectName = extractProjectName(projectPath.replace(/\//g, "-").replace(/^-/, ""))

            allMessages.push({
              date: new Date(entry.timestamp).toISOString(),
              message: redactSensitiveContent(text),
              project: projectName,
            })
          }
        } catch (parseError) {
          // Skip malformed lines
        }
      }
    } catch (readError) {
      console.error(`Error reading ${historyFile}: ${readError.message}`)
    }
  }

  // Sort by date
  allMessages.sort((a, b) => {
    if (!a.date) return 1
    if (!b.date) return -1
    return new Date(a.date) - new Date(b.date)
  })

  // Deduplicate by date + message + project
  const seen = new Set()
  const uniqueMessages = allMessages.filter((msg) => {
    const key = `${msg.date}|${msg.message}|${msg.project}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  fs.writeFileSync(outputFile, JSON.stringify(uniqueMessages, null, 2))

  console.log(
    `Extracted ${uniqueMessages.length} messages (${allMessages.length - uniqueMessages.length} duplicates removed) to ${outputFile}`
  )
}

main()
