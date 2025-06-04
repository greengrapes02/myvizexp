function _1(md){return(
md`# Billboard Top 10 Visualizations`
)}

function _billboard_hot_100_flattenedCopy(__query,FileAttachment,invalidation){return(
__query(FileAttachment("billboard_hot_100_flattened copy.csv"),{from:{table:"billboard_hot_100_flattened copy"},sort:[],slice:{to:null,from:null},filter:[],select:{columns:null}},invalidation)
)}

async function _data(d3,FileAttachment){return(
d3.csv(await FileAttachment("billboard_hot_100_flattened copy.csv").url())
)}

function _4(data){return(
data.slice(0, 10)
)}

function _top10Data(data){return(
data
  .filter(d => +d.rank <= 10) // keep only rank 1 to 10
  .map(d => ({
    ...d,
    rank: +d.rank,
    date: new Date(d.date),
    year: new Date(d.date).getFullYear()
  }))
)}

function _6(top10Data){return(
top10Data.slice(0, 10)
)}

function _artistYearCounts(d3,top10Data){return(
Array.from(
  d3.rollup(
    top10Data,
    v => v.length,
    d => d.artist,
    d => d.year
  ),
  ([artist, yearMap]) =>
    Array.from(yearMap, ([year, count]) => ({
      artist,
      year,
      count
    }))
).flat()
)}

function _8(artistYearCounts){return(
artistYearCounts.slice(0, 10)
)}

function _sortedArtists(d3,artistYearCounts){return(
Array.from(
  d3.rollup(
    artistYearCounts,
    v => d3.sum(v, d => d.count),
    d => d.artist
  ),
  ([artist, total]) => ({ artist, total })
)
.sort((a, b) => d3.descending(a.total, b.total))
.map(d => d.artist)
)}

function _formatName(){return(
function formatName(str) {
  return str
    .replace(/_/g, ' ')
    .replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}
)}

function _11(sortedArtists){return(
sortedArtists.slice(0, 10)
)}

function _selectedYear(Inputs,top10Data){return(
Inputs.select(
  Array.from(new Set(top10Data.map(d => d.year))).sort((a, b) => a - b),
  { label: "Select a year", value: 2000 }
)
)}

function _heatmap(sortedArtists,artistYearCounts,html,d3,selectedYear,selectedArtist)
{
  const topN = 50;
  const cellWidth = 30;
  const cellHeight = 16;
  const labelWidth = 124;
  const labelLeftMargin = 40;
  const maxCharLength = 12;

  const topArtists = sortedArtists.slice(0, topN);
  const filteredData = artistYearCounts.filter(d => topArtists.includes(d.artist));
  const years = Array.from(new Set(filteredData.map(d => d.year))).sort((a, b) => a - b);

  const margin = { top: 80, right: 40, bottom: 80, left: 0 };
  const width = margin.left + years.length * cellWidth + margin.right;
  const height = margin.top + topN * cellHeight + margin.bottom;

  const outerContainer = html`<div style="width: 100%; font-family: JetBrains Mono, monospace; color: #f8f8f2; background: #0b0c10; padding-bottom: 10px;"></div>`;

  const titleBlock = html`
  <div style="padding: 16px 0; text-align: left; max-width: 700px; margin-left: 40px;">
    <h2 style="margin: 0; font-size: 24px; color: #ffffff;">Top Artists on the Billboard Charts Across Six Decades</h2>
    <p style="margin-top: 8px; font-size: 13px; color: #ffffff;">
      This heat map shows how many songs the top 50 artists contributed to the Billboard Top 100 over the years. Brighter cells indicate more songs. Explore when each artist was most active, their peak periods, and their journey through chart history.
    </p>
  </div>
`;

  outerContainer.appendChild(titleBlock);

  const container = html`<div style="display: flex; position: relative; width: 100%;"></div>`;

  const stickySvg = d3.create("svg")
    .attr("width", labelWidth)
    .attr("height", height)
    .style("background", "#0b0c10")
    .style("font-family", "JetBrains Mono, monospace")
    .style("position", "sticky")
    .style("left", "0px")
    .style("top", "0px")
    .style("z-index", "10")
    .style("flex", "none");

  const wrapper = html`<div style="overflow-x: auto; overflow-y: hidden; width: 100%;"></div>`;

  const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", height)
    .style("background", "#0b0c10")
    .style("font-family", "JetBrains Mono, monospace");

  const x = d3.scaleBand()
    .domain(years)
    .range([margin.left, margin.left + years.length * cellWidth])
    .padding(0);

  const y = d3.scaleBand()
    .domain(topArtists)
    .range([margin.top, margin.top + topN * cellHeight])
    .padding(0);

  const maxCount = d3.max(filteredData, d => d.count);
  const alphaScale = d3.scaleLinear()
    .domain([0, maxCount])
    .range([0.1, 1]);

  const tooltip = d3.select("body")
    .append("div")
    .style("position", "absolute")
    .style("background", "#1f1f1f")
    .style("color", "#fff")
    .style("padding", "6px 10px")
    .style("border-radius", "4px")
    .style("font-family", "JetBrains Mono, monospace")
    .style("font-size", "12px")
    .style("pointer-events", "none")
    .style("opacity", 0);

  svg.append("g")
    .selectAll("rect")
    .data(filteredData)
    .join("rect")
    .attr("x", d => x(d.year))
    .attr("y", d => y(d.artist))
    .attr("width", x.bandwidth())
    .attr("height", y.bandwidth())
    .attr("fill", d => `rgba(94, 241, 242, ${alphaScale(d.count)})`)
    .style("cursor", "pointer")
    .on("mouseover", (event, d) => {
      tooltip.transition().duration(100).style("opacity", 0.9);
      tooltip.html(`🎤 <b>${d.artist}</b><br>📅 <b>${d.year}</b><br>🎶 Songs: <b>${d.count}</b>`)
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 28}px`);
    })
    .on("mousemove", (event) => {
      tooltip.style("left", `${event.pageX + 10}px`).style("top", `${event.pageY - 28}px`);
    })
    .on("mouseout", () => {
      tooltip.transition().duration(150).style("opacity", 0);
    })
    .on("click", (event, d) => {
      selectedYear.value = d.year;
      selectedArtist.value = d.artist;
    });

  const labelGroup = stickySvg.append("g");

  topArtists.forEach((artist, i) => {
    const yPos = margin.top + i * cellHeight + cellHeight / 2 + 4;
    const truncated = artist.length > maxCharLength ? artist.slice(0, maxCharLength - 3) + "..." : artist;

    labelGroup.append("text")
      .attr("x", labelLeftMargin)
      .attr("y", yPos)
      .attr("text-anchor", "start")
      .attr("alignment-baseline", "middle")
      .style("fill", "#f8f8f2")
      .style("font-size", "11px")
      .text(truncated);
  });

  stickySvg.append("line")
    .attr("x1", labelWidth - 1)
    .attr("x2", labelWidth - 1)
    .attr("y1", margin.top)
    .attr("y2", margin.top + topN * cellHeight)
    .attr("stroke", "#5ef1f2")
    .attr("stroke-width", 1);

  const gx = svg.append("g")
    .attr("transform", `translate(0, ${margin.top})`)
    .call(d3.axisTop(x).tickSizeOuter(0));

  gx.selectAll("text")
    .attr("x", 0)
    .attr("y", -cellWidth / 2)
    .style("text-anchor", "middle")
    .style("font-size", "10px")
    .style("fill", "#f8f8f2");

  svg.selectAll(".tick line").attr("stroke", "#5ef1f2");
  svg.selectAll(".domain").attr("stroke", "#5ef1f2");

  wrapper.appendChild(svg.node());
  container.appendChild(stickySvg.node());
  container.appendChild(wrapper);
  outerContainer.appendChild(container);

  return outerContainer;
}


function _treemap(selectedYear,top10Data,html,d3)
{
  const year = selectedYear;
  const data = top10Data.filter(d => d.year === year);
  if (data.length === 0) return html`<div style="color:white">No data for ${year}</div>`;

  const artistTotals = Array.from(
    d3.rollup(data, v => v.length, d => d.artist),
    ([artist, count]) => ({ artist, count })
  ).sort((a, b) => d3.descending(a.count, b.count));

  const total = d3.sum(artistTotals, d => d.count);
  let cumulative = 0;
  const topArtists = [];
  for (const entry of artistTotals) {
    cumulative += entry.count;
    topArtists.push(entry.artist);
    if (cumulative / total >= 0.75) break;
  }

  const artistSongCounts = d3.rollup(
    data,
    v => v.length,
    d => d.artist,
    d => d.song
  );

  const artistGroups = [];
  let miscGroup = { name: "Other", children: [] };

  for (const [artist, songs] of artistSongCounts) {
    const children = Array.from(songs, ([song, count]) => ({
      name: song,
      value: count
    }));
    if (topArtists.includes(artist)) {
      artistGroups.push({ name: artist, children });
    } else {
      miscGroup.children.push(...children);
    }
  }

  if (miscGroup.children.length > 0) {
    artistGroups.push(miscGroup);
  }

  const hierarchy = { name: "root", children: artistGroups };
  const width = 1000;
  const height = 500;

  const root = d3.hierarchy(hierarchy)
    .sum(d => d.value || 1)
    .sort((a, b) => {
      if (a.data.name === "Other") return 1;
      if (b.data.name === "Other") return -1;
      return b.value - a.value;
    });

  d3.treemap()
    .tile(d3.treemapBinary)
    .size([width, height])
    .paddingOuter(2)
    .paddingInner(1)
    .round(true)(root);

  const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", height)
    .style("background", "#0c0c0c");

  const tooltip = d3.select("body")
    .append("div")
    .style("position", "absolute")
    .style("background", "#1f1f1f")
    .style("color", "#fff")
    .style("padding", "6px 10px")
    .style("border-radius", "4px")
    .style("font-family", "JetBrains Mono, monospace")
    .style("font-size", "12px")
    .style("pointer-events", "none")
    .style("opacity", 0);

  const allColors = [
    '#b2e562', '#6754e5', '#6821dd', '#141051', '#992be2',
    '#1920c8', '#621aa0', '#31147f', '#45926b', '#6f9d62',
    '#35732a', '#67dd7c', '#6de252', '#a6d5a1', '#80ea90',
    '#416db0', '#56b09b', '#6795be', '#9db2d8', '#255351'
  ];
  const otherColor = '#454c49';

  const artistColor = new Map();
  artistGroups.forEach((group, i) => {
    if (group.name === "Other") {
      artistColor.set(group.name, otherColor);
    } else {
      artistColor.set(group.name, allColors[i % allColors.length]);
    }
  });

  function getContrastColor(hex) {
    const c = d3.color(hex);
    const lum = 0.299 * c.r + 0.587 * c.g + 0.114 * c.b;
    return lum > 140 ? "#0c0c0c" : "#fefefe";
  }

  const group = svg.selectAll("g.artist")
    .data(root.children)
    .join("g")
    .attr("class", "artist")
    .attr("transform", d => `translate(${d.x0},${d.y0})`);

  group.append("rect")
    .attr("width", d => d.x1 - d.x0)
    .attr("height", d => d.y1 - d.y0)
    .attr("fill", d => artistColor.get(d.data.name))
    .attr("stroke", "none");

  group.append("text")
    .attr("x", 6)
    .attr("y", 16)
    .style("fill", d => getContrastColor(artistColor.get(d.data.name)))
    .style("font-family", "JetBrains Mono, monospace")
    .style("font-size", "11px")
    .text(d => d.data.name.slice(0, 18));

  group.append("line")
    .attr("x1", 4)
    .attr("x2", d => (d.x1 - d.x0) - 4)
    .attr("y1", 20)
    .attr("y2", 20)
    .attr("stroke", d => getContrastColor(artistColor.get(d.data.name)))
    .attr("stroke-width", 1)
    .style("stroke-dasharray", "2,2")
    .style("shape-rendering", "crispEdges");

  group.each(function(groupD) {
    const g = d3.select(this);
    if (!groupD.children) return;

    const songs = groupD.children.map(c => ({
      name: c.data.name,
      value: c.data.value
    }));

    const songRoot = d3.hierarchy({ children: songs })
      .sum(d => d.value)
      .sort((a, b) => b.value - a.value);

    d3.treemap()
      .tile(d3.treemapBinary)
      .size([groupD.x1 - groupD.x0, groupD.y1 - groupD.y0 - 20])
      .paddingInner(1)
      .round(true)(songRoot);

    const songNode = g.selectAll("g.song")
      .data(songRoot.leaves())
      .join("g")
      .attr("class", "song")
      .attr("transform", d => `translate(${d.x0},${d.y0 + 20})`);

    songNode.append("rect")
      .attr("width", d => d.x1 - d.x0)
      .attr("height", d => d.y1 - d.y0)
      .attr("fill", artistColor.get(groupD.data.name))
      .attr("stroke", "#222")
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        tooltip.transition().duration(100).style("opacity", 0.9);
        tooltip.html(
          `🎤 <b>${groupD.data.name}</b><br>🎵 <b>${d.data.name}</b><br>🔁 <b>${d.value} times</b><br>📅 <b>${year}</b>`
        )
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 28}px`);
      })
      .on("mousemove", function(event) {
        tooltip.style("left", `${event.pageX + 10}px`)
               .style("top", `${event.pageY - 28}px`);
      })
      .on("mouseout", function() {
        tooltip.transition().duration(150).style("opacity", 0);
      });

    songNode.append("text")
      .attr("x", 4)
      .attr("y", 12)
      .style("fill", getContrastColor(artistColor.get(groupD.data.name)))
      .style("font-family", "JetBrains Mono, monospace")
      .style("font-size", "9px")
      .text(d => d.data.name ? d.data.name.slice(0, 14) : "Unknown");

    songNode.append("text")
      .attr("x", 4)
      .attr("y", 22)
      .style("fill", getContrastColor(artistColor.get(groupD.data.name)))
      .style("font-family", "JetBrains Mono, monospace")
      .style("font-size", "8px")
      .text(d => `${d.value}`);
  });

  return svg.node();
}


function _selectedArtist(Inputs,d3,top10Data){return(
Inputs.select(
  Array.from(
    d3.rollup(
      top10Data.filter(d => d.rank <= 10),
      v => v.length,
      d => d.artist
    )
  )
  .sort((a, b) => d3.descending(a[1], b[1]))
  .map(([artist]) => artist),
  { label: "Select Artist" }
)
)}

function _artistScrollableChart(selectedArtist,top10Data,html,d3)
{
  const artist = selectedArtist;
  const pxPerWeek = 24;
  const pxGapWeek = pxPerWeek / 4;
  const height = 500;
  const margin = { top: 40, right: 30, bottom: 100, left: 50 };

  const artistData = top10Data
    .filter(d => d.artist === artist && d.rank <= 10)
    .map(d => ({ ...d, date: new Date(d.date) }));

  if (artistData.length === 0) return html`<div style="color:white">No data for ${artist}</div>`;

  const tooltip = d3.select("body")
    .append("div")
    .style("position", "absolute")
    .style("background", "#1f1f1f")
    .style("color", "#fff")
    .style("padding", "6px 10px")
    .style("border-radius", "4px")
    .style("font-family", "JetBrains Mono, monospace")
    .style("font-size", "12px")
    .style("pointer-events", "none")
    .style("opacity", 0);

  const minDate = d3.min(artistData, d => d.date);
  const maxDate = d3.max(artistData, d => d.date);
  const allWeeks = d3.timeWeek.range(minDate, d3.timeWeek.offset(maxDate, 1));
  const activeWeekSet = new Set(artistData.map(d => d3.timeWeek.floor(d.date).getTime()));

  const timeline = [];
  let currentX = margin.left;
  let gapBuffer = [];
  const gaps = [];

  for (let i = 0; i < allWeeks.length; i++) {
    const week = allWeeks[i];
    const isActive = activeWeekSet.has(week.getTime());

    if (!isActive) gapBuffer.push(week);

    if (isActive || i === allWeeks.length - 1) {
      if (gapBuffer.length > 4) {
        const xStart = currentX;
        for (const gapWeek of gapBuffer) {
          timeline.push({ week: gapWeek, x: currentX, isActive: false });
          currentX += pxGapWeek;
        }
        gaps.push({
          start: gapBuffer[0],
          end: gapBuffer[gapBuffer.length - 1],
          x: xStart,
          width: gapBuffer.length * pxGapWeek,
          count: gapBuffer.length
        });
      } else {
        for (const gapWeek of gapBuffer) {
          timeline.push({ week: gapWeek, x: currentX, isActive: true });
          currentX += pxPerWeek;
        }
      }
      gapBuffer = [];

      if (isActive) {
        timeline.push({ week, x: currentX, isActive: true });
        currentX += pxPerWeek;
      }
    }
  }

  const fullWidth = currentX + margin.right;
  const visibleWidth = 40 * pxPerWeek;
  const weekX = new Map(timeline.map(d => [d.week.getTime(), d.x]));
  const y = d3.scaleLinear().domain([10, 1]).range([height - margin.bottom, margin.top]);

  const mainSvg = d3.create("svg")
    .attr("width", fullWidth)
    .attr("height", height)
    .style("background", "#0a0a0a");

  const yAxisSvg = d3.create("svg")
    .attr("width", margin.left)
    .attr("height", height)
    .style("background", "#0a0a0a");

  yAxisSvg.append("g")
    .attr("transform", `translate(${margin.left - 1},0)`)
    .call(d3.axisLeft(y).ticks(10).tickFormat(d3.format("d")))
    .attr("color", "#cccccc")
    .selectAll("text")
    .style("font-family", "JetBrains Mono, monospace")
    .style("font-size", "10px");

  mainSvg.append("defs")
    .append("pattern")
    .attr("id", "diagonalHatch")
    .attr("patternUnits", "userSpaceOnUse")
    .attr("width", 8)
    .attr("height", 8)
    .attr("patternTransform", "rotate(45)")
    .append("line")
    .attr("x1", 0)
    .attr("y1", 0)
    .attr("x2", 0)
    .attr("y2", 8)
    .attr("stroke", "white")
    .attr("stroke-opacity", 0.5)
    .attr("stroke-width", 1);

  const gapGroup = mainSvg.append("g");

  gapGroup.selectAll("rect")
    .data(gaps)
    .join("rect")
    .attr("x", d => d.x)
    .attr("y", margin.top)
    .attr("width", d => d.width)
    .attr("height", height - margin.bottom - margin.top)
    .attr("fill", `url(#diagonalHatch)`);

  gapGroup.selectAll("text")
    .data(gaps)
    .join("text")
    .attr("x", d => d.x + d.width / 2)
    .attr("y", height / 2)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("transform", d => `rotate(-90,${d.x + d.width / 2},${height / 2})`)
    .text(d => {
      const count = d.count;
      if (count >= 52) return `${Math.round(count / 52)} Years`;
      if (count >= 4) return `${Math.round(count / 4)} Months`;
      return `${count} Weeks`;
    })
    .style("font-family", "JetBrains Mono, monospace")
    .style("font-size", "10px")
    .style("fill", "#fff")
    .style("pointer-events", "none")
    .each(function () {
      const bbox = this.getBBox();
      d3.select(this.parentNode)
        .insert("rect", "text")
        .attr("x", bbox.x - 2)
        .attr("y", bbox.y - 1)
        .attr("width", bbox.width + 4)
        .attr("height", bbox.height + 2)
        .attr("fill", "#000");
    });

  const songGroups = d3.groups(artistData, d => d.song);
  const songWeights = new Map(songGroups.map(([song, entries]) => [
    song, d3.sum(entries, d => 11 - d.rank)
  ]));

  const color = d3.scaleOrdinal()
    .domain(songWeights.keys())
    .range(["#00ffff", "#ff00ff", "#00ff99", "#ffcc00", "#ff66cc", "#9966ff", "#33ccff", "#ff3300"]);

  const thickness = d3.scaleLinear()
    .domain(d3.extent(Array.from(songWeights.values())))
    .range([1.5, 6]);

  mainSvg.append("g")
    .attr("class", "axis-lines")
    .selectAll("line")
    .data(d3.range(1, 11))
    .join("line")
    .attr("x1", margin.left)
    .attr("x2", fullWidth - margin.right)
    .attr("y1", d => y(d))
    .attr("y2", d => y(d))
    .attr("stroke", "#222")
    .style("stroke-dasharray", "2,2");

  const legendData = [];

  for (const [song, entries] of songGroups) {
    const weekMap = new Map(entries.map(d => [d3.timeWeek.floor(d.date).getTime(), d.rank]));
    const songTimeline = timeline.map(w => {
      const key = w.week.getTime();
      return weekMap.has(key)
        ? { week: w.week, rank: weekMap.get(key), active: true }
        : { week: w.week, active: false };
    });

    const segments = [];
    let currentSegment = [];

    for (const point of songTimeline) {
      if (point.active) {
        currentSegment.push({ date: point.week, rank: point.rank });
      } else if (currentSegment.length > 0) {
        segments.push(currentSegment);
        currentSegment = [];
      }
    }
    if (currentSegment.length > 0) segments.push(currentSegment);

    for (const segment of segments) {
      const firstPoint = segment[0];
      const firstX = weekX.get(firstPoint.date.getTime());
      legendData.push({ song, x: firstX });

      mainSvg.append("path")
        .datum(segment)
        .attr("fill", "none")
        .attr("stroke", color(song))
        .attr("stroke-width", thickness(songWeights.get(song)))
        .attr("d", d3.line()
          .x(d => weekX.get(d.date.getTime()))
          .y(d => y(d.rank)))
        .style("filter", "drop-shadow(0px 0px 2px #ffffff77)");

      const hoverGroup = mainSvg.append("g");
      const dotGroup = mainSvg.append("g");

      hoverGroup.selectAll("circle")
        .data(segment)
        .join("circle")
        .attr("cx", d => weekX.get(d.date.getTime()))
        .attr("cy", d => y(d.rank))
        .attr("r", 6)
        .attr("fill", "transparent")
        .style("pointer-events", "all")
        .on("mouseover", (event, d) => {
          tooltip.transition().duration(100).style("opacity", 0.9);
          tooltip.html(
            `🎤 <b>${artist}</b><br>🎵 <b>${song}</b><br>📈 Rank: <b>${d.rank}</b><br>📅 ${d3.timeFormat("%B %d, %Y")(d.date)}`
          )
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 28}px`);
        })
        .on("mousemove", event => {
          tooltip.style("left", `${event.pageX + 10}px`).style("top", `${event.pageY - 28}px`);
        })
        .on("mouseout", () => {
          tooltip.transition().duration(150).style("opacity", 0);
        });

      dotGroup.selectAll("circle")
        .data(segment)
        .join("circle")
        .attr("cx", d => weekX.get(d.date.getTime()))
        .attr("cy", d => y(d.rank))
        .attr("r", 2)
        .attr("fill", color(song))
        .style("filter", "drop-shadow(0 0 1px white)");
    }
  }

  const legendGroup = mainSvg.append("g");
  legendData.sort((a, b) => a.x - b.x);
  let lastRight = -Infinity;

  for (const { song, x } of legendData) {
    const displayName = song.length > 12 ? song.slice(0, 10) + "…" : song;
    const estWidth = displayName.length * 6.5 + 12;

    if (x > lastRight + 8) {
      legendGroup.append("circle")
        .attr("cx", x)
        .attr("cy", margin.top - 18)
        .attr("r", 4)
        .attr("fill", color(song));

      legendGroup.append("text")
        .attr("x", x + 6)
        .attr("y", margin.top - 15)
        .attr("fill", "#ffffff")
        .attr("text-anchor", "start")
        .text(displayName)
        .style("font-family", "JetBrains Mono, monospace")
        .style("font-size", "10px");

      lastRight = x + estWidth;
    }
  }

  mainSvg.append("g")
    .selectAll("text")
    .data(timeline.filter(d => d.isActive))
    .join("text")
    .text(d => d3.timeFormat("%b %d, %Y")(d.week))
    .attr("x", d => d.x)
    .attr("y", height - margin.bottom + 15)
    .attr("transform", d => `rotate(-90,${d.x},${height - margin.bottom + 15})`)
    .attr("text-anchor", "end")
    .attr("fill", "#aaa")
    .style("font-size", "9px")
    .style("font-family", "JetBrains Mono, monospace");

  const container = html`<div style="display:flex; align-items:flex-start;"></div>`;
  const stickyYAxis = html`<div style="position:sticky; left:0; z-index:2;">${yAxisSvg.node()}</div>`;
  const scrollArea = html`<div style="overflow-x:auto; width:${visibleWidth}px;"></div>`;
  const inner = document.createElement("div");
  inner.style.width = `${fullWidth}px`;
  inner.appendChild(mainSvg.node());
  scrollArea.appendChild(inner);
  container.appendChild(stickyYAxis);
  container.appendChild(scrollArea);
  return container;
}


export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["billboard_hot_100_flattened copy.csv", {url: new URL("./files/2bd57e7392fa08884d465a46ab21704a61f1620fd0cd22d240510f2e236315003ca1b3bfc8aec984b0c0290aad9a7a586e5115e9d7bd9c13627c0085a71cb73f.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer("billboard_hot_100_flattenedCopy")).define("billboard_hot_100_flattenedCopy", ["__query","FileAttachment","invalidation"], _billboard_hot_100_flattenedCopy);
  main.variable(observer("data")).define("data", ["d3","FileAttachment"], _data);
  main.variable(observer()).define(["data"], _4);
  main.variable(observer("top10Data")).define("top10Data", ["data"], _top10Data);
  main.variable(observer()).define(["top10Data"], _6);
  main.variable(observer("artistYearCounts")).define("artistYearCounts", ["d3","top10Data"], _artistYearCounts);
  main.variable(observer()).define(["artistYearCounts"], _8);
  main.variable(observer("sortedArtists")).define("sortedArtists", ["d3","artistYearCounts"], _sortedArtists);
  main.variable(observer("formatName")).define("formatName", _formatName);
  main.variable(observer()).define(["sortedArtists"], _11);
  main.variable(observer("viewof selectedYear")).define("viewof selectedYear", ["Inputs","top10Data"], _selectedYear);
  main.variable(observer("selectedYear")).define("selectedYear", ["Generators", "viewof selectedYear"], (G, _) => G.input(_));
  main.variable(observer("viewof heatmap")).define("viewof heatmap", ["sortedArtists","artistYearCounts","html","d3","selectedYear","selectedArtist"], _heatmap);
  main.variable(observer("heatmap")).define("heatmap", ["Generators", "viewof heatmap"], (G, _) => G.input(_));
  main.variable(observer("viewof treemap")).define("viewof treemap", ["selectedYear","top10Data","html","d3"], _treemap);
  main.variable(observer("treemap")).define("treemap", ["Generators", "viewof treemap"], (G, _) => G.input(_));
  main.variable(observer("viewof selectedArtist")).define("viewof selectedArtist", ["Inputs","d3","top10Data"], _selectedArtist);
  main.variable(observer("selectedArtist")).define("selectedArtist", ["Generators", "viewof selectedArtist"], (G, _) => G.input(_));
  main.variable(observer("viewof artistScrollableChart")).define("viewof artistScrollableChart", ["selectedArtist","top10Data","html","d3"], _artistScrollableChart);
  main.variable(observer("artistScrollableChart")).define("artistScrollableChart", ["Generators", "viewof artistScrollableChart"], (G, _) => G.input(_));
  return main;
}
