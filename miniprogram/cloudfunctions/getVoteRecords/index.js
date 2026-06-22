﻿const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const { voteId } = event

  if (!voteId) {
    return {
      success: false,
      message: '缺少投票ID'
    }
  }

  try {
    const res = await db.collection('vote_records')
      .where({ voteId: voteId })
      .orderBy('voteTime', 'desc')
      .get()

    return {
      success: true,
      list: res.data || []
    }
  } catch (err) {
    console.error('获取投票记录失败:', err)
    return {
      success: false,
      message: err.message || '获取失败'
    }
  }
}