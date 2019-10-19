// time parser
var parseTime = d3.timeParse("%Y-%m-%d");
var bisectDate = d3.bisector(d => d.date).left;

// set dynamic width and height: lineChart
var lineChartWidth = $('#lineChart').width(),
    lineChartHeight = Math.round(lineChartWidth * 0.75);

// Margin object 
var margin = { top: 20, right: 10, bottom: 80, left: 80 };

// Load CSV file
d3.csv("data/zaatari-refugee-camp-population.csv", function(data) {

    /***************************
    /         AREA CHART
    ****************************/
    // process the data
    var processedData = data.map(function(d) {
        var item = { date: null, population: null };
        item.population = +d.population;
        item.date = parseTime(d.date);
        return item;
    });

    // Update the width and height
    var marginLineChartWidth = lineChartWidth - margin.left - margin.right;
    var marginLineChartHeight = lineChartHeight - margin.top - margin.bottom;

    var maxTime = d3.max(processedData,
            (d) => d.date),
        minTime = d3.min(processedData,
            (d) => d.date),
        maxPopulation = d3.max(processedData,
            (d) => d.population),
        minPopulation = d3.min(processedData,
            (d) => d.population);

    // Make the timescale
    var timeScale = d3.scaleTime()
        .domain([minTime, maxTime])
        .range([0, marginLineChartWidth]);

    // Population LinearScale
    var populationScale = d3.scaleLinear()
        .domain([minPopulation - 1000, maxPopulation + 1000])
        .range([marginLineChartHeight, 0]);

    // draw the svg
    var svg = d3.select('#lineChart')
        .append('svg')
        .attr('width', lineChartWidth)
        .attr('height', lineChartHeight);

    // axes
    var xAxis = d3.axisBottom()
        .scale(timeScale)
        .tickFormat(d3.timeFormat('%b %Y'));

    var yAxis = d3.axisLeft()
        .scale(populationScale)
        .tickFormat(d3.format(",.0f"))
        .ticks(8);

    // area
    var area = d3.area()
        .curve(d3.curveLinear)
        .x(d => timeScale(d.date))
        .y0(marginLineChartHeight)
        .y1(d => populationScale(d.population))

    // bonus area
    var area100k = d3.area()
        .curve(d3.curveLinear)
        .x(d => timeScale(d.date))
        .y0(populationScale(100000))
        .y1(function(d) {
            var population = 100000;
            if (d.population > population) {
                population = d.population;
            }
            return populationScale(population);
        })

    // draw the chart
    svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .append('path')
        .datum(processedData)
        .attr("class", "area")
        .attr("fill", "#c4c4c4")
        .attr("stroke", "#8c8c8c")
        .attr("stroke-width", 2)
        .attr('d', area);

    // draw the overlay chart
    svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .append('path')
        .datum(processedData)
        .attr("class", "area")
        .attr("fill", "#1d1a18")
        .attr("stroke", "#8c8c8c")
        .attr("stroke-width", 2)
        .attr('d', area100k);

    // Draw the x-axis
    svg.append("g")
        .attr("class", "axis x-axis")
        .attr("transform", "translate(" + margin.left + "," + (marginLineChartHeight + margin.top) + ")")
        .call(xAxis)
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)");

    // Draw the y-axis
    svg.append("g")
        .attr("class", "axis y-axis")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .call(yAxis);

    // text label for y-axis
    svg.append("text")
        .attr('class', 'chart-label')
        .attr("transform", "rotate(-90)")
        .attr("y", margin.left / 5)
        .attr("x", 0 - (lineChartHeight / 2))
        .style("text-anchor", "middle")
        .text("Population");

    // text label for the x axis
    svg.append("text")
        .attr('class', 'chart-label')
        .attr("y", lineChartHeight - (margin.bottom / 5))
        .attr("x", lineChartWidth / 2)
        .style("text-anchor", "middle")
        .text("Time");

    // Graph title
    svg.append("text")
        .attr('class', 'graph-title')
        .attr("y", margin.top)
        .attr("x", 2.5 * lineChartWidth / 4)
        .style("text-anchor", "middle")
        .text("Population in the Za'atari refugee camp over time (2013-2015).");

    // tooltip    
    var focus = svg.append("g")
        .attr("class", "focus")
        .style("display", "none");

    // append the circle at the intersection               
    focus.append("circle")
        .attr("class", "y")
        .style("fill", "none")
        .style("stroke", "#696969")
        .style('stroke-width', 3)
        .attr("r", 5);

    // place the value at the intersection
    focus.append("text")
        .attr("class", "y1")
        .style('fill', '#696969')
        .attr("dx", 8)
        .attr("dy", "-.3em");

    // append the rectangle to capture mouse               
    svg.append("rect")
        .attr("width", marginLineChartWidth)
        .attr("height", marginLineChartHeight)
        .style("fill", "none")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .style("pointer-events", "all")
        .on("mouseover", function() { focus.style("display", null); })
        .on("mouseout", function() { focus.style("display", "none"); })
        .on("mousemove", mousemove);

    function mousemove() {
        var x0 = timeScale.invert(d3.mouse(this)[0]),
            i = bisectDate(processedData, x0, 1),
            d0 = processedData[i - 1],
            d1 = processedData[i],
            d = x0 - d0.date > d1.date - x0 ? d1 : d0;

        focus.select("circle.y")
            .attr("transform",
                "translate(" + (margin.left + timeScale(d.date)) + "," +
                (margin.top + populationScale(d.population)) + ")");

        focus.select("text.y1")
            .attr("transform",
                "translate(" + (margin.left + timeScale(d.date)) + "," +
                (margin.top + populationScale(d.population)) + ")")
            .text(d.population);
    }

});

/***************************
/         BAR CHART
****************************/
var shelterData = [{
    type: 'caravans',
    percentage: 79.68
}, {
    type: 'mixed*',
    percentage: 10.81
}, {
    type: 'tents',
    percentage: 9.51
}];


// set dynamic width and height: barChart
var barChartWidth = $('#barChart').width(),
    barChartHeight = lineChartHeight;

var marginBarChartWidth = barChartWidth - margin.left - margin.right;
var marginBarChartHeight = barChartHeight - margin.top - margin.bottom;

// draw the svg
var barSvg = d3.select('#barChart')
    .append('svg')
    .attr('width', barChartWidth)
    .attr('height', barChartHeight);

// Percentage LinearScale
var percentageScale = d3.scaleLinear()
    .domain([0, 100])
    .range([marginBarChartHeight, 0]);

// ordinal scale for x-axis
var xScale = d3.scaleBand()
    .domain(shelterData.map(d => d.type))
    .range([0, marginBarChartWidth])
    .padding(0.2);

// axes
var xAxis = d3.axisBottom()
    .scale(xScale);

var yAxis = d3.axisLeft()
    .scale(percentageScale)
    .tickFormat(d3.format(",.0f"));

// draw the x-axis
barSvg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(" + margin.left + "," + (barChartHeight - margin.bottom) + ")")
    .call(xAxis)

// Draw the y-axis
barSvg.append("g")
    .attr("class", "axis y-axis")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .call(yAxis);

barSvg.selectAll('rect')
    .data(shelterData)
    .enter()
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .append('rect')
    .attr("fill", "#c4c4c4")
    .attr("stroke", "#8c8c8c")
    .attr("stroke-width", 1.5)
    .attr('x', d => xScale(d.type))
    .attr('y', d => percentageScale(d.percentage))
    .attr('width', d => xScale.bandwidth())
    .attr('height', d => marginBarChartHeight - percentageScale(d.percentage));

// text label for y-axis
barSvg.append("text")
    .attr('class', 'chart-label')
    .attr("transform", "rotate(-90)")
    .attr("y", margin.left / 2)
    .attr("x", 0 - (barChartHeight / 2))
    .style("text-anchor", "middle")
    .text("Percentage");

// text label for the x axis
barSvg.append("text")
    .attr('class', 'chart-label')
    .attr("y", barChartHeight - (margin.bottom / 2))
    .attr("x", barChartWidth / 2 + margin.left / 2)
    .style("text-anchor", "middle")
    .text("Type of Shelter");

// Graph title
barSvg.append("text")
    .attr('class', 'graph-title')
    .attr("y", margin.top)
    .attr("x", 2.5 * barChartWidth / 4)
    .style("text-anchor", "middle")
    .text("Shelter types and distribution.");