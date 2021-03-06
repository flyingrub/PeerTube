/* tslint:disable:no-unused-expression */

import 'mocha'
import * as chai from 'chai'
import * as request from 'supertest'
const expect = chai.expect

import {
  ServerInfo,
  flushTests,
  runServer,
  loginAndGetAccessToken,
  uploadVideo,
  getVideosList
} from './utils'

describe('Test a client controllers', function () {
  let server: ServerInfo

  before(async function () {
    this.timeout(120000)

    await flushTests()

    server = await runServer(1)
    server.accessToken = await loginAndGetAccessToken(server)

    const videoAttributes = {
      name: 'my super name for pod 1',
      description: 'my super description for pod 1'
    }
    await uploadVideo(server.url, server.accessToken, videoAttributes)

    const res = await getVideosList(server.url)
    const videos = res.body.data

    expect(videos.length).to.equal(1)

    server.video = videos[0]
  })

  it('It should have valid Open Graph tags on the watch page with video id', async function () {
    const res = await request(server.url)
                        .get('/videos/watch/' + server.video.id)
                        .expect(200)

    expect(res.text).to.contain('<meta property="og:title" content="my super name for pod 1" />')
    expect(res.text).to.contain('<meta property="og:description" content="my super description for pod 1" />')
  })

  it('It should have valid Open Graph tags on the watch page with video uuid', async function () {
    const res = await request(server.url)
                        .get('/videos/watch/' + server.video.uuid)
                        .expect(200)

    expect(res.text).to.contain('<meta property="og:title" content="my super name for pod 1" />')
    expect(res.text).to.contain('<meta property="og:description" content="my super description for pod 1" />')
  })

  after(async function () {
    process.kill(-server.app.pid)

    // Keep the logs if the test failed
    if (this['ok']) {
      await flushTests()
    }
  })
})
