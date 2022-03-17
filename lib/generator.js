'use strict';

const nunjucks = require('nunjucks')
const env = new nunjucks.Environment()
const pathFn = require('path')
const fs = require('fs')
const xmlescape = require('xml-escape')
const strip_tags = require('locutus/php/strings/strip_tags')

// Add filters
env.addFilter('uriencode', str => encodeURI(str))

env.addFilter('strip_html', str => {
  if (!str || str === "") return ""
  return strip_tags(str)
})

env.addFilter('xml_escape', str => {
  if (!str || str === "") return ""
  return xmlescape(str)
})

env.addFilter('noControlChars', str => str.replace(/[\x00-\x09\x0B-\x1F\x7F]/g, ''))

env.addFilter('date_to_rfc822', str => (new Date(str)).toUTCString())

// filter by Hays
env.addFilter('shorten_from_begin', function (str) {
  let re = /<\/script>/;
  return str.slice(str.search(re) + 10);
});

// Templates
const rss2TmplSrc = pathFn.join(__dirname, '../rss2.xml')
const rss2Tmpl = nunjucks.compile(fs.readFileSync(rss2TmplSrc, 'utf8'), env)

module.exports = function (locals) {
  const config = this.config
  const tags = locals.tags
  const categories = locals.categories
  const feedConfig = config.podcast
  const template = rss2Tmpl

  let posts = locals.posts.sort('-date')
  if (feedConfig.limit) posts = posts.limit(feedConfig.limit)

  // Check url
  let url = config.url
  if (url[url.length - 1] !== '/') url += '/'

  const podcast_category = categories.findOne({
    name: 'podcast'
  })
  const podcast_posts = podcast_category ? podcast_category.posts.sort('date', -1).data : []

  // Render
  var xml = template.render({
    config,
    url,
    posts,
    tags,
    categories,
    podcast_posts,
    feed_url: config.root + feedConfig.path,
  })

  return {
    path: feedConfig.path,
    data: xml,
  }
}