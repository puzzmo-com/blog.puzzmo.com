/* Renders the dashboard from window.DATA. Vanilla JS + SVG, no dependencies.
   All colors come from CSS custom properties so light/dark stay in sync;
   charts re-render when the color scheme flips. */
;(() => {
  const D = window.DATA
  const NS = "http://www.w3.org/2000/svg"
  const W = 960
  const H = 300
  const M = { top: 26, right: 16, bottom: 26, left: 52 }
  const plotW = W - M.left - M.right
  const plotH = H - M.top - M.bottom

  const root = document.querySelector(".viz-root")
  const cvar = (name) => getComputedStyle(root).getPropertyValue(name).trim()

  const fmt = (n) => Math.round(n).toLocaleString("en-US")
  const fmtCompact = (n) =>
    Math.abs(n) >= 10000 ? (n / 1000).toLocaleString("en-US", { maximumFractionDigits: 0 }) + "k"
    : Math.abs(n) >= 1000 ? (n / 1000).toLocaleString("en-US", { maximumFractionDigits: 1 }) + "k"
    : fmt(n)

  const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const monthLabel = (key, always) => {
    const [y, m] = key.split("-").map(Number)
    if (!always && m !== 1 && m !== 7) return null
    return MONTHS_SHORT[m - 1] + " ’" + String(y).slice(2)
  }

  function svgEl(name, attrs, parent) {
    const el = document.createElementNS(NS, name)
    for (const [k, v] of Object.entries(attrs || {})) el.setAttribute(k, v)
    if (parent) parent.appendChild(el)
    return el
  }

  // Rounded away from the baseline, square at it. dir: 1 = grows up, -1 = down.
  function barPath(x, y, w, h, dir) {
    const r = Math.min(4, h / 2, w / 2)
    if (h <= 0) return ""
    if (dir === 1) {
      const top = y
      return `M${x},${top + h} L${x},${top + r} Q${x},${top} ${x + r},${top} L${x + w - r},${top} Q${x + w},${top} ${x + w},${top + r} L${x + w},${top + h} Z`
    }
    const bot = y + h
    return `M${x},${y} L${x + w},${y} L${x + w},${bot - r} Q${x + w},${bot} ${x + w - r},${bot} L${x + r},${bot} Q${x},${bot} ${x},${bot - r} Z`
  }

  function niceTicks(maxVal) {
    if (maxVal <= 0) return [0, 1]
    const rough = maxVal / 4
    const mag = Math.pow(10, Math.floor(Math.log10(rough)))
    const step = [1, 2, 2.5, 5, 10].map((s) => s * mag).find((s) => maxVal / s <= 5)
    const ticks = []
    for (let v = 0; v <= maxVal + 1e-9; v += step) ticks.push(v)
    if (ticks.at(-1) < maxVal) ticks.push(ticks.at(-1) + step)
    return ticks
  }

  // ---- tooltip ------------------------------------------------------------
  const tip = document.getElementById("tooltip")
  function showTip(evt, title, rows) {
    tip.replaceChildren()
    const t = document.createElement("div")
    t.className = "t-title"
    t.textContent = title
    tip.appendChild(t)
    for (const r of rows) {
      const row = document.createElement("div")
      row.className = "t-row"
      if (r.color) {
        const key = document.createElement("span")
        key.className = "linekey"
        key.style.background = r.color
        row.appendChild(key)
      }
      const label = document.createElement("span")
      label.textContent = r.label
      const val = document.createElement("b")
      val.textContent = r.value
      row.append(label, val)
      tip.appendChild(row)
    }
    tip.style.display = "block"
    const pad = 14
    const rect = tip.getBoundingClientRect()
    let x = evt.clientX + pad
    let y = evt.clientY + pad
    if (x + rect.width > innerWidth - 8) x = evt.clientX - rect.width - pad
    if (y + rect.height > innerHeight - 8) y = evt.clientY - rect.height - pad
    tip.style.left = x + "px"
    tip.style.top = y + "px"
  }
  const hideTip = () => (tip.style.display = "none")

  // ---- shared chart scaffolding --------------------------------------------
  function makeCard(el, title, desc, legendItems) {
    el.replaceChildren()
    const h = document.createElement("h2")
    h.textContent = title
    const d = document.createElement("p")
    d.className = "desc"
    d.textContent = desc
    el.append(h, d)
    if (legendItems && legendItems.length > 1) {
      const legend = document.createElement("div")
      legend.className = "legend"
      for (const item of legendItems) {
        const key = document.createElement("span")
        key.className = "key"
        const swatch = document.createElement("span")
        swatch.className = item.line ? "linekey" : "swatch"
        swatch.style.background = item.color
        const name = document.createElement("span")
        name.textContent = item.name
        key.append(swatch, name)
        legend.appendChild(key)
      }
      el.appendChild(legend)
    }
    const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": title })
    el.appendChild(svg)
    return svg
  }

  function drawFrame(svg, ticks, yScale, yFmt) {
    for (const t of ticks) {
      const y = yScale(t)
      svgEl("line", { x1: M.left, x2: W - M.right, y1: y, y2: y, stroke: t === 0 ? cvar("--baseline") : cvar("--gridline"), "stroke-width": 1 }, svg)
      svgEl("text", { x: M.left - 8, y: y + 4, "text-anchor": "end", fill: cvar("--text-muted"), "font-size": 11, style: "font-variant-numeric: tabular-nums" }, svg).textContent = yFmt(t)
    }
  }

  function drawMonthAxis(svg, xCenter) {
    D.months.forEach((m, i) => {
      const label = monthLabel(m.month)
      if (!label) return
      svgEl("text", { x: xCenter(i), y: H - 8, "text-anchor": "middle", fill: cvar("--text-muted"), "font-size": 11 }, svg).textContent = label
    })
  }

  function drawClaudeMarker(svg, xLeft) {
    const i = D.months.findIndex((m) => m.month === D.claudeCodeMonth)
    if (i < 0) return
    const x = xLeft(i)
    svgEl("line", { x1: x, x2: x, y1: M.top - 6, y2: H - M.bottom, stroke: cvar("--text-muted"), "stroke-width": 1 }, svg)
    svgEl("text", { x: x + 5, y: M.top - 10, fill: cvar("--text-secondary"), "font-size": 11, "font-weight": 600 }, svg).textContent = "Claude Code →"
  }

  const slot = plotW / D.months.length
  const barW = Math.min(24, slot - 6)
  const xLeft = (i) => M.left + i * slot + (slot - barW) / 2
  const xCenter = (i) => M.left + i * slot + slot / 2

  function hoverify(hit, mark, onEnter) {
    hit.addEventListener("pointerenter", () => (mark.style.filter = "brightness(1.15)"))
    hit.addEventListener("pointerleave", () => { mark.style.filter = ""; hideTip() })
    hit.addEventListener("pointermove", onEnter)
  }

  // ---- column chart (single or 2-series stacked) ---------------------------
  function columnChart(el, { title, desc, series, marker = true }) {
    const svg = makeCard(el, title, desc, series.map((s) => ({ name: s.name, color: cvar(s.color) })))
    const totals = D.months.map((m) => series.reduce((a, s) => a + s.value(m), 0))
    const ticks = niceTicks(Math.max(...totals))
    const yMax = ticks.at(-1)
    const yScale = (v) => M.top + plotH - (v / yMax) * plotH
    drawFrame(svg, ticks, yScale, fmtCompact)

    D.months.forEach((m, i) => {
      const partial = m.month === D.partialMonth
      const group = svgEl("g", {}, svg)
      let cumTop = yScale(0)
      series.forEach((s, si) => {
        const v = s.value(m)
        if (v <= 0) return
        const hPx = yScale(0) - yScale(v)
        const isTop = si === series.length - 1 || series.slice(si + 1).every((ss) => ss.value(m) <= 0)
        const gap = si > 0 ? 2 : 0
        const y = cumTop - hPx
        const d = isTop
          ? barPath(xLeft(i), y, barW, Math.max(hPx - gap, 0.5), 1)
          : `M${xLeft(i)},${y} h${barW} v${Math.max(hPx - gap, 0.5)} h${-barW} Z`
        svgEl("path", { d, fill: cvar(s.color), "fill-opacity": partial ? 0.45 : 1 }, group)
        cumTop = y
      })
      const hit = svgEl("rect", { x: M.left + i * slot, y: M.top, width: slot, height: plotH, fill: "transparent" }, svg)
      hoverify(hit, group, (evt) =>
        showTip(evt, m.month + (partial ? " (partial)" : ""),
          series.map((s) => ({ color: cvar(s.color), label: s.name, value: fmt(s.value(m)) }))
            .concat(series.length > 1 ? [{ label: "Total", value: fmt(totals[i]) }] : []))
      )
    })
    drawMonthAxis(svg, xCenter)
    if (marker) drawClaudeMarker(svg, (i) => M.left + i * slot)
  }

  // ---- diverging chart (additions up / deletions down) ---------------------
  function divergingChart(el, { title, desc, up, down }) {
    const svg = makeCard(el, title, desc, [
      { name: up.name, color: cvar(up.color) },
      { name: down.name, color: cvar(down.color) },
    ])
    const maxUp = Math.max(...D.months.map(up.value))
    const maxDown = Math.max(...D.months.map(down.value))
    const upTicks = niceTicks(maxUp)
    const step = upTicks[1] - upTicks[0]
    const downMax = Math.ceil(maxDown / step) * step || step
    const yMax = upTicks.at(-1)
    const span = yMax + downMax
    const yScale = (v) => M.top + ((yMax - v) / span) * plotH
    const ticks = []
    for (let v = -downMax; v <= yMax + 1e-9; v += step) ticks.push(v)
    drawFrame(svg, ticks, yScale, (t) => fmtCompact(Math.abs(t)))

    D.months.forEach((m, i) => {
      const partial = m.month === D.partialMonth
      const group = svgEl("g", {}, svg)
      const uv = up.value(m)
      const dv = down.value(m)
      if (uv > 0)
        svgEl("path", { d: barPath(xLeft(i), yScale(uv), barW, yScale(0) - yScale(uv) - 1, 1), fill: cvar(up.color), "fill-opacity": partial ? 0.45 : 1 }, group)
      if (dv > 0)
        svgEl("path", { d: barPath(xLeft(i), yScale(0) + 1, barW, yScale(-dv) - yScale(0) - 1, -1), fill: cvar(down.color), "fill-opacity": partial ? 0.45 : 1 }, group)
      const hit = svgEl("rect", { x: M.left + i * slot, y: M.top, width: slot, height: plotH, fill: "transparent" }, svg)
      hoverify(hit, group, (evt) =>
        showTip(evt, m.month + (partial ? " (partial)" : ""), [
          { color: cvar(up.color), label: up.name, value: "+" + fmt(uv) },
          { color: cvar(down.color), label: down.name, value: "−" + fmt(dv) },
          { label: "Net", value: (uv - dv >= 0 ? "+" : "−") + fmt(Math.abs(uv - dv)) },
        ])
      )
    })
    drawMonthAxis(svg, xCenter)
    drawClaudeMarker(svg, (i) => M.left + i * slot)
  }

  // ---- line chart with crosshair (1+ series) --------------------------------
  function lineChart(el, { title, desc, series, yFmt, yCap = Infinity, endLabel }) {
    const svg = makeCard(el, title, desc, series.map((s) => ({ name: s.name, color: cvar(s.color), line: true })))
    const allValues = series.flatMap((s) => D.months.map(s.value))
    const ticks = niceTicks(Math.min(Math.max(...allValues), yCap))
    const yMax = Math.min(ticks.at(-1), yCap)
    const shown = ticks.filter((t) => t <= yCap)
    const yScale = (v) => M.top + plotH - (Math.min(v, yMax) / yMax) * plotH
    drawFrame(svg, shown, yScale, yFmt)

    const seriesPts = series.map((s) => D.months.map((m, i) => [xCenter(i), yScale(s.value(m))]))
    series.forEach((s, si) => {
      const pts = seriesPts[si]
      const color = cvar(s.color)
      svgEl("path", { d: "M" + pts.map((p) => p.join(",")).join(" L"), fill: "none", stroke: color, "stroke-width": 2, "stroke-linejoin": "round", "stroke-linecap": "round" }, svg)
      const last = pts.at(-1)
      svgEl("circle", { cx: last[0], cy: last[1], r: 6, fill: cvar("--surface-1") }, svg)
      svgEl("circle", { cx: last[0], cy: last[1], r: 4, fill: color }, svg)
      svgEl("text", { x: last[0] - 8, y: last[1] - 10, "text-anchor": "end", fill: cvar("--text-primary"), "font-size": 11.5, "font-weight": 600 }, svg).textContent = endLabel(s.value(D.months.at(-1)))
    })

    const cross = svgEl("line", { y1: M.top, y2: H - M.bottom, stroke: cvar("--baseline"), "stroke-width": 1, visibility: "hidden" }, svg)
    const dots = series.map((s) => svgEl("circle", { r: 5, fill: cvar(s.color), stroke: cvar("--surface-1"), "stroke-width": 2, visibility: "hidden" }, svg))
    const overlay = svgEl("rect", { x: M.left, y: M.top, width: plotW, height: plotH, fill: "transparent" }, svg)
    overlay.addEventListener("pointermove", (evt) => {
      const rect = svg.getBoundingClientRect()
      const px = ((evt.clientX - rect.left) / rect.width) * W
      const i = Math.max(0, Math.min(D.months.length - 1, Math.round((px - M.left - slot / 2) / slot)))
      cross.setAttribute("x1", xCenter(i))
      cross.setAttribute("x2", xCenter(i))
      cross.setAttribute("visibility", "visible")
      dots.forEach((dot, si) => {
        dot.setAttribute("cx", seriesPts[si][i][0])
        dot.setAttribute("cy", seriesPts[si][i][1])
        dot.setAttribute("visibility", "visible")
      })
      const m = D.months[i]
      const rows = series.map((s) => ({ color: cvar(s.color), label: s.name, value: s.tipValue(m) })).concat(series[0].extraRows ? series[0].extraRows(m) : [])
      showTip(evt, m.month, rows)
    })
    overlay.addEventListener("pointerleave", () => {
      cross.setAttribute("visibility", "hidden")
      dots.forEach((dot) => dot.setAttribute("visibility", "hidden"))
      hideTip()
    })
    drawMonthAxis(svg, xCenter)
    drawClaudeMarker(svg, (i) => M.left + i * slot)
  }

  // ---- calendar heatmap (Claude Code prompts, GitHub-graph style) -----------
  function calendarHeatmap(el, { title, desc }) {
    const U = D.claudeUsage
    const byDate = Object.fromEntries(U.days.map((d) => [d.date, d]))
    const dark = matchMedia("(prefers-color-scheme: dark)").matches
    // sequential blue ramp, low→high; stepping toward the mode's surface = less
    const ramp = dark
      ? ["#0d366b", "#1c5cab", "#3987e5", "#9ec5f4"]
      : ["#cde2fb", "#86b6ef", "#3987e5", "#0d366b"]
    // quartile buckets over nonzero day totals, GitHub-style
    const nonzero = U.days.map((d) => d.total).sort((a, b) => a - b)
    const q = (p) => nonzero[Math.min(nonzero.length - 1, Math.floor(p * nonzero.length))]
    const thresholds = [q(0.25), q(0.5), q(0.75)]
    const bucket = (n) => (n <= thresholds[0] ? 0 : n <= thresholds[1] ? 1 : n <= thresholds[2] ? 2 : 3)

    // grid: columns are weeks starting Sunday, from the week of firstDay to today
    const start = new Date(U.firstDay + "T12:00:00")
    start.setDate(start.getDate() - start.getDay())
    const end = new Date(U.lastDay + "T12:00:00")
    const CELL = 12
    const PITCH = CELL + 3
    const LEFT = 30
    const TOP = 18
    const weeks = Math.ceil(((end - start) / 86400000 + 1) / 7)
    const width = LEFT + weeks * PITCH + 4
    const height = TOP + 8 * PITCH + 6 // extra row for the less→more key

    const svg = makeCard(el, title, desc, [])
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`)
    svg.style.maxWidth = width * 1.4 + "px"

    const MONTHS_ROW = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    for (const [row, name] of [[1, "Mon"], [3, "Wed"], [5, "Fri"]]) {
      svgEl("text", { x: LEFT - 6, y: TOP + row * PITCH + CELL - 3, "text-anchor": "end", fill: cvar("--text-muted"), "font-size": 9 }, svg).textContent = name
    }

    let lastMonth = -1
    const day = new Date(start)
    for (let w = 0; w < weeks; w++) {
      for (let r = 0; r < 7; r++) {
        if (day > end) break
        const key = day.toLocaleDateString("sv")
        if (r === 0 && day.getMonth() !== lastMonth && day.getDate() <= 14) {
          lastMonth = day.getMonth()
          svgEl("text", { x: LEFT + w * PITCH, y: TOP - 6, fill: cvar("--text-muted"), "font-size": 9.5 }, svg).textContent =
            MONTHS_ROW[lastMonth] + (lastMonth === 0 ? " ’" + String(day.getFullYear()).slice(2) : "")
        }
        const entry = byDate[key]
        const cell = svgEl("rect", {
          x: LEFT + w * PITCH,
          y: TOP + r * PITCH,
          width: CELL,
          height: CELL,
          rx: 2,
          fill: entry ? ramp[bucket(entry.total)] : "transparent",
          stroke: entry ? "none" : cvar("--gridline"),
          "stroke-width": 1,
        }, svg)
        cell.addEventListener("pointermove", (evt) => {
          cell.style.filter = "brightness(1.15)"
          const folders = entry
            ? Object.entries(entry.folders)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([f, n]) => ({ label: f, value: Math.round((n / entry.total) * 100) + "% · " + n }))
            : []
          showTip(evt, key + " — " + (entry?.estimated ? "≈" : "") + (entry ? entry.total : 0) + " prompts" + (entry?.estimated ? " (partly estimated)" : ""), folders)
        })
        cell.addEventListener("pointerleave", () => { cell.style.filter = ""; hideTip() })
        day.setDate(day.getDate() + 1)
      }
    }

    // less → more key
    const ly = TOP + 7 * PITCH + 1
    svgEl("text", { x: width - 36 - 4 * PITCH - 6, y: ly + CELL - 3, "text-anchor": "end", fill: cvar("--text-muted"), "font-size": 9 }, svg).textContent = "Less"
    ramp.forEach((c, i) => svgEl("rect", { x: width - 36 - (4 - i) * PITCH, y: ly, width: CELL, height: CELL, rx: 2, fill: c }, svg))
    svgEl("text", { x: width - 2, y: ly + CELL - 3, "text-anchor": "end", fill: cvar("--text-muted"), "font-size": 9 }, svg).textContent = "More"
  }

  // ---- stat tiles -----------------------------------------------------------
  function renderKpis() {
    const wrap = document.getElementById("kpis")
    wrap.replaceChildren()
    for (const k of D.kpis) {
      const tile = document.createElement("div")
      tile.className = "tile"
      const label = document.createElement("div")
      label.className = "label"
      label.textContent = k.label
      const value = document.createElement("div")
      value.className = "value"
      value.textContent = k.unit === "%" ? k.after.toFixed(1) + "%" : fmt(k.after)
      const delta = document.createElement("div")
      delta.className = "delta"
      const span = document.createElement("span")
      let deltaText
      if (k.unit === "%") deltaText = (k.after >= k.before ? "+" : "−") + Math.abs(k.after - k.before).toFixed(1) + " pts"
      else if (k.before > 0) deltaText = (k.after >= k.before ? "+" : "−") + Math.abs(((k.after - k.before) / k.before) * 100).toFixed(0) + "%"
      else deltaText = "new"
      span.textContent = deltaText
      if (k.after > k.before && !k.neutral) span.className = "up"
      delta.appendChild(span)
      delta.append(" vs year before — was " + (k.unit === "%" ? k.before.toFixed(1) + "%" : fmt(k.before)))
      tile.append(label, value, delta)
      wrap.appendChild(tile)
    }
  }

  // ---- render all -----------------------------------------------------------
  function renderAll() {
    renderKpis()
    columnChart(document.getElementById("chart-commits"), {
      title: "Commits per month, all of GitHub",
      desc: "Commit contributions across every repository (public and private).",
      series: [{ name: "Commits", color: "--series-1", value: (m) => m.commits }],
    })
    columnChart(document.getElementById("chart-prs"), {
      title: "Pull requests opened per month, all of GitHub",
      desc: "PR contributions across every repository.",
      series: [{ name: "PRs", color: "--series-1", value: (m) => m.prs }],
    })
    divergingChart(document.getElementById("chart-loc"), {
      title: "Lines changed per month in puzzmo-com/app",
      desc: `Your commits only; lockfiles/generated files excluded and ${D.locMeta.skipped} bulk commits over ${D.locMeta.threshold.toLocaleString("en-US")} lines dropped.`,
      up: { name: "Added", color: "--diverge-pos", value: (m) => m.locAdditions },
      down: { name: "Removed", color: "--diverge-neg", value: (m) => m.locDeletions },
    })
    lineChart(document.getElementById("chart-prsize"), {
      title: "Typical PR size, all of GitHub",
      desc: `Lines changed per PR you opened; PRs over ${D.prBulkThreshold.toLocaleString("en-US")} lines excluded as bulk changes.`,
      yFmt: fmtCompact,
      endLabel: (v) => fmt(v),
      series: [
        { name: "Average", color: "--series-1", value: (m) => m.prSizeMean ?? 0, tipValue: (m) => fmt(m.prSizeMean ?? 0) + " lines" },
        { name: "Median", color: "--series-2", value: (m) => m.prSizeMedian ?? 0, tipValue: (m) => fmt(m.prSizeMedian ?? 0) + " lines" },
      ],
    })
    lineChart(document.getElementById("chart-share"), {
      title: `Share of ${D.org} PRs authored by @${D.user}`,
      desc: "Your PRs as a percentage of all PRs opened across the org each month.",
      yFmt: (t) => t + "%",
      yCap: 100,
      endLabel: (v) => v.toFixed(0) + "%",
      series: [
        {
          name: "Share",
          color: "--series-1",
          value: (m) => m.prShare,
          tipValue: (m) => m.prShare.toFixed(1) + "%",
          extraRows: (m) => [
            { label: "Mine", value: fmt(m.orgPRsMine) },
            { label: "Org total", value: fmt(m.orgPRsTotal) },
          ],
        },
      ],
    })
    columnChart(document.getElementById("chart-split"), {
      title: `Where the commits went: ${D.org} vs everywhere else`,
      desc: "Monthly commit contributions split by repository owner.",
      series: [
        { name: D.org, color: "--series-1", value: (m) => m.orgCommits },
        { name: "Other repos", color: "--series-2", value: (m) => m.otherCommits },
      ],
    })
    if (D.claudeUsage) {
      calendarHeatmap(document.getElementById("chart-claude"), {
        title: "Claude Code usage",
        desc: `${D.claudeUsage.totalPrompts.toLocaleString("en-US")} prompts across both machines, by day — hover a day for the folder breakdown. Where session logs were pruned, days are topped up from Claude Code's stats caches (marked ≈, no folder attribution); Jul–Sep 2025 has no surviving local data.`,
      })
    } else {
      document.getElementById("chart-claude").style.display = "none"
    }
  }

  renderAll()
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", renderAll)
})()
