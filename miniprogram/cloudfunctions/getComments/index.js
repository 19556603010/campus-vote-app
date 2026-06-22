// 云函数 getComments - 分页拉取评论
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { voteId, page = 1, pageSize = 10 } = event || {}

  if (!voteId) {
    return { success: false, message: '缺少投票ID' }
  }

  const safePage = Math.max(1, parseInt(page, 10) || 1)
  const safeSize = Math.min(50, Math.max(1, parseInt(pageSize, 10) || 10))

  try {
    const countRes = await db.collection('comments')
      .where({ voteId: voteId, status: 'normal' })
      .count()

    const listRes = await db.collection('comments')
      .where({ voteId: voteId, status: 'normal' })
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
    console.error('拉取评论失败:', err)
    return { success: false, message: err.message || '拉取评论失败' }
  }
}
