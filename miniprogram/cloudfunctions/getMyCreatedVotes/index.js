// 云函数 getMyCreatedVotes - 我创建的投票(分页)
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
    const countRes = await db.collection('votes')
      .where({ _openid: openid })
      .count()

    const listRes = await db.collection('votes')
      .where({ _openid: openid })
      .orderBy('createTime', 'desc')
      .skip((safePage - 1) * safeSize)
      .limit(safeSize)
      .get()

    return {
      success: true,
      list: listRes.data || [],
      total: countRes.total || 0,
      page: safePage,
      pageSize: safeSize,
      hasMore: safePage * safeSize < (countRes.total || 0)
    }
  } catch (err) {
    console.error('拉取我创建的投票失败:', err)
    return { success: false, message: err.message || '拉取失败' }
  }
}
