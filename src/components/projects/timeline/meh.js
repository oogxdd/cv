import React, { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { projects as dataProjects, fieldColors } from '@/data'

const ProjectsTimeline = ({
  selectedFields = [],
  selectedTags = [],
  hoveredProject = null,
  setHoveredProject = () => {},
}) => {
  const svgRef = useRef(null)

  // Initialize tooltip
  const initTooltip = () => {
    return d3
      .select('body')
      .append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0)
      .style('background-color', 'white')
      .style('position', 'absolute')
      .style('border', 'solid')
      .style('border-width', '2px')
      .style('border-radius', '5px')
      .style('padding', '5px')
  }

  // Define mouse event handlers for tooltip
  const defineTooltipEventHandlers = (Tooltip) => {
    return {
      mousemove(event, d) {
        Tooltip.html('Project Name: ' + d.name)
          .style('left', event.pageX + 'px')
          .style('top', event.pageY + 10 + 'px')
      },
      mouseover(event, d) {
        Tooltip.style('opacity', 1)
        d3.select(this)
          .style('stroke', 'black')
          .style('stroke-width', '0.5px')
          .style('opacity', 1)
      },
      mouseleave(d) {
        Tooltip.style('opacity', 0)
        d3.select(this).style('stroke', 'none').style('opacity', 0.8)
      },
    }
  }

  // Create zoom behavior
  const createZoomBehavior = (xScale, xAxis, projectGroup, xAxisGroup) => {
    return d3
      .zoom()
      .scaleExtent([1, Infinity]) // Adjust this to limit zoom
      .translateExtent([
        [xScale(new Date(1997, 0, 1)), 0],
        [xScale(new Date(2023, 11, 31)), 0],
      ]) // New line
      .on('zoom', (event) => {
        const { x, k } = event.transform
        const newXScale = event.transform.rescaleX(xScale)
        projectGroup.attr('transform', `translate(${x},0) scale(${k}, ${k})`)
        const newAxis = xAxisGroup.call(xAxis.scale(newXScale))

        // Adjust square size and y position dynamically based on k
        projectGroup
          .selectAll('.fieldRect')
          .attr('height', (d) => {
            return 100 / k // or whatever logic you use to set the square size based on k
          })
          .attr('y', 0)

        // Apply tick styling here
        newAxis.selectAll('text').style('font-size', '18px')
      })
  }

  useEffect(() => {
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    const Tooltip = initTooltip()

    const svgGroup = svg.append('g').attr('class', 'everything')
    const projectGroup = svgGroup.append('g').attr('class', 'projects')
    const xAxisGroup = svgGroup
      .append('g')
      .attr('transform', 'translate(0,100)')

    const timelineStartDate = new Date(1997, 0, 1)
    const timelineEndDate = new Date(2030, 11, 31)

    const selectedStartDate = new Date(2023, 7, 31)
    // const selectedEndDate = new Date(2015, 8, 15)
    const selectedEndDate = new Date(2020, 6, 1)

    const xScale = d3
      .scaleTime()
      .domain([timelineStartDate, timelineEndDate])
      .range([0, window.innerWidth])

    const xAxis = d3
      .axisBottom(xScale)
      .ticks(d3.timeYear.every(1))
      .tickFormat(d3.timeFormat('%Y'))
      .tickSizeInner(10) // New: inner tick size
      .tickPadding(10) // New: tick padding
    xAxisGroup
      .call(xAxis)
      .selectAll('text')
      .style('font-size', '22px') // Increased font size
      .style('fill', '#333') // New: text color

    const zoom = createZoomBehavior(xScale, xAxis, projectGroup, xAxisGroup)

    const initialScale =
      window.innerWidth / (xScale(selectedStartDate) - xScale(selectedEndDate))
    const initialTranslate = -xScale(selectedEndDate) * initialScale

    const initialTransform = d3.zoomIdentity
      .translate(initialTranslate, 0)
      .scale(initialScale)
    svg.call(zoom.transform, initialTransform)

    svg.call(zoom)

    const { mousemove, mouseover, mouseleave } =
      defineTooltipEventHandlers(Tooltip)

    // Rendering projects
    const projects = projectGroup
      .selectAll('.project')
      .data(dataProjects)
      .enter()
      .append('g')
      .attr('class', 'project')

    projects.each(function (d) {
      const projectGroup = d3.select(this)
      const totalWidth =
        xScale(new Date(d.endDate)) - xScale(new Date(d.startDate))
      const padding = 0
      // const padding = 1
      const maxRectSize = 20
      const actualRectSize = Math.min(maxRectSize, totalWidth - 2 * padding)

      // Create project rectangle
      projectGroup
        .append('rect')
        .attr('x', xScale(new Date(d.startDate)))
        .attr('y', 0)
        .attr('width', totalWidth)
        .attr('height', 100)
        .attr('fill', 'grey')
        .attr('opacity', 0.3)

      let x = padding
      let y = padding

      // Loop to create inner field rectangles
      for (const field of d.fields) {
        if (x + actualRectSize + padding > totalWidth) {
          x = padding
          y += actualRectSize + padding
        }

        projectGroup
          .append('rect')
          .attr('class', 'fieldRect') // add this line
          .attr('x', xScale(new Date(d.startDate)) + x)
          .attr('y', y)
          .attr('width', actualRectSize)
          .attr('height', actualRectSize)
          .attr('fill', fieldColors[field])

        x += actualRectSize + padding
      }

      projectGroup
        .on('mouseover', mouseover)
        .on('mousemove', mousemove)
        .on('mouseout', mouseleave)
    })
    // projects.each(function (d) {
    //   const projectGroup = d3.select(this)
    //   const totalWidth =
    //     xScale(new Date(d.endDate)) - xScale(new Date(d.startDate))
    //   let offsetHeight = 0
    //   const totalHeight = 100

    //   for (const field of d.fields) {
    //     const height = totalHeight / d.fields.length
    //     projectGroup
    //       .append('rect')
    //       .attr('x', xScale(new Date(d.startDate)))
    //       .attr('y', 100 - totalHeight + offsetHeight)
    //       .attr('width', totalWidth)
    //       .attr('height', height)
    //       .attr('fill', fieldColors[field])
    //     offsetHeight += height
    //   }
    //   projectGroup
    //     .on('mouseover', mouseover)
    //     .on('mousemove', mousemove)
    //     .on('mouseout', mouseleave)
    // })
  }, [selectedFields, selectedTags, hoveredProject])

  return <svg ref={svgRef} width="100%" height="300"></svg>
}

export default ProjectsTimeline