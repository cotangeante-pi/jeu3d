const Save = {
  _fields: ['health', 'hunger', 'money', 'iq', 'badges', 'physicalStats', 'currentJob',
            'posX', 'posY', 'posZ', 'yaw', 'pitch', 'inventory', 'selectedSlot',
            'carPositions', 'gameTime'],

  write() {
    const data = {};
    this._fields.forEach(k => { data[k] = State[k]; });
    localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(data));
  },

  read() {
    const raw = localStorage.getItem(CONFIG.SAVE_KEY);
    if (!raw) return false;
    try {
      const data = JSON.parse(raw);
      this._fields.forEach(k => {
        if (data[k] !== undefined) State[k] = data[k];
      });
      return true;
    } catch (e) {
      return false;
    }
  },

  clear() {
    localStorage.removeItem(CONFIG.SAVE_KEY);
  }
};
