App({
  onLaunch: function () {
    this.globalData = {
      votes: []
    }
    this.loadVotesFromStorage()
  },

  loadVotesFromStorage: function () {
    try {
      const data = wx.getStorageSync('votes')
      if (data) {
        this.globalData.votes = JSON.parse(data)
      }
    } catch (e) {
      console.error('加载投票数据失败:', e)
    }
  },

  saveVotesToStorage: function () {
    try {
      wx.setStorageSync('votes', JSON.stringify(this.globalData.votes))
    } catch (e) {
      console.error('保存投票数据失败:', e)
    }
  },

  addVote: function (vote) {
    const newVote = {
      ...vote,
      _id: Date.now().toString(),
      createTime: new Date(),
      totalVoters: 0,
      status: 'active'
    }
    this.globalData.votes.unshift(newVote)
    this.saveVotesToStorage()
    return newVote
  },

  getVoteById: function (id) {
    return this.globalData.votes.find(v => v._id === id)
  },

  updateVote: function (id, updates) {
    const index = this.globalData.votes.findIndex(v => v._id === id)
    if (index > -1) {
      this.globalData.votes[index] = { ...this.globalData.votes[index], ...updates }
      this.saveVotesToStorage()
      return this.globalData.votes[index]
    }
    return null
  },

  deleteVote: function (id) {
    const index = this.globalData.votes.findIndex(v => v._id === id)
    if (index > -1) {
      this.globalData.votes.splice(index, 1)
      this.saveVotesToStorage()
      return true
    }
    return false
  },

  getAllVotes: function () {
    return this.globalData.votes
  }
})