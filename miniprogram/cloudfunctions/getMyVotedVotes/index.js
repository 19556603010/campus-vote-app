// 云函数 getMyVotedVotes - 我参与过的投票(分页)
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const { page = 1, pageSize = 10 } = event || {}
  const safePage = Math.max(1, parseInt(page, 10) || 1)
  const safeSize = Math.min(50, Math.max(1, parseInt(pageSize, 10) || 10))

  try {
    // 1. 找出我参与过的 voteId 列表
    const recordsRes = await db.collection('vote_records')
      .where({ userOpenId: openid })
      .orderBy('voteTime', 'desc')
      .get()

    const records = recordsRes.data || []
    if (records.length === 0) {
      return { success: true, list: [], total: 0, page: safePage, pageSize: safeSize, hasMore: false }
    }

    // 2. 去重 + 分页
    const seen = {}
    const allIds = []
    for (const r of records) {
      if (r.voteId && !seen[r.voteId]) {
        seen[r.voteId] = true
        allIds.push(r.voteId)
      }
    }
    const pageIds = allIds.slice((safePage - 1) * safeSize, safePage * safeSize)

    // 3. 批量拉取 vote 详情
    const tasks = pageIds.map(id => db.collection('votes').doc(id).get().catch(() => null))
    const results = await Promise.all(tasks)
    const list = results.filter(r => r && r.data).map(r => r.data)

    return {
      success: true,
      list: list,
      total: allIds.length,
      page: safePage,
      pageSize: safeSize,
      hasMore: safePage * safeSize < allIds.length
    }
  } catch (err) {
    console.error('拉取我参与的投票失败:', err)
    return { success: false, message: err.message || '拉取失败' }
  }
}
