import axios from "axios";
import { ToadScheduler, SimpleIntervalJob, Task } from 'toad-scheduler'
import { v4 as uuid4 } from "uuid";
import { User, UserModel } from "../models/user-model";
import { Server as HttpServer } from "http";
import { Notifier } from "./notifier";
import { DocumentType } from "@typegoose/typegoose";

const notifier = new Notifier();

export const createAndScheduleNotifier = (server: HttpServer) => {
  notifier.connect(server)
  const scheduler = new ToadScheduler()

  const updateHourlyNotificationsTask = new Task('hourly notifications', () => updateHourlyNotifications())
  const updateDailyNotificationsTask = new Task('daily notifications', () => updateDailyNotifications())
  const updateWeeklyNotificationsTask = new Task('weekly notifications', () => updateWeeklyNotifications())

  scheduler.addSimpleIntervalJob(new SimpleIntervalJob({ minutes: 15 }, updateHourlyNotificationsTask))
  scheduler.addSimpleIntervalJob(new SimpleIntervalJob({ hours: 6 }, updateDailyNotificationsTask))
  scheduler.addSimpleIntervalJob(new SimpleIntervalJob({ days: 1 }, updateWeeklyNotificationsTask))

  // scheduler.addSimpleIntervalJob(new SimpleIntervalJob({ seconds: 5 }, updateHourlyNotificationsTask))
  // scheduler.addSimpleIntervalJob(new SimpleIntervalJob({ seconds: 10 }, updateDailyNotificationsTask))
  // scheduler.addSimpleIntervalJob(new SimpleIntervalJob({ seconds: 15 }, updateWeeklyNotificationsTask))
}

const updateHourlyNotifications = () => {
  UserModel.find({ alerts: { $nin: [null, new Object()] } }).then(async (usersWithAlerts) => {
    if (usersWithAlerts.length > 0) {
      const coingeckoData = await getHourlyCoingeckoData(usersWithAlerts)

      usersWithAlerts.forEach(async (user) => {
        let wasSuccess = false;
        while (!wasSuccess) {
          wasSuccess = await setUserHourlyNotifications(user, coingeckoData)
        }
      })
    }
  })
}

const updateDailyNotifications = () => {
  UserModel.find({ alerts: { $nin: [null, new Object()] } }).then(async (usersWithAlerts) => {
    if (usersWithAlerts.length > 0) {
      const coingeckoData = await getDailyCoingeckoData(usersWithAlerts)

      usersWithAlerts.forEach(async (user) => {
        let wasSuccess = false
        while (!wasSuccess) {
          wasSuccess = await setUserDailyNotifications(user, coingeckoData)
        }
      })
    }
  })
}

const updateWeeklyNotifications = () => {
  UserModel.find({ alerts: { $nin: [null, new Object()] } }).then(async (usersWithAlerts) => {
    if (usersWithAlerts.length > 0) {
      const coingeckoData = await getWeeklyCoingeckoData(usersWithAlerts)

      usersWithAlerts.forEach(async (user) => {
        let wasSuccess = false;
        while (!wasSuccess) {
          wasSuccess = await setUserWeeklyNotifications(user, coingeckoData)
        }
      })
    }
  })
}

const getHourlyCoingeckoData = async (users: DocumentType<User>[]) => {
  return (await axios.get(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=eur&ids=${users.map((user) => {
    const coingeckoNames = [];
    for (const coingeckoName in user.alerts) {
      coingeckoNames.push(coingeckoName)
    }
    return coingeckoNames
  }).join(",")}&per_page=100&page=1&sparkline=false&price_change_percentage=1h`)).data
}

const getDailyCoingeckoData = async (users: DocumentType<User>[]) => {
  return (await axios.get(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=eur&ids=${users.map((user) => {
    const coingeckoNames = [];
    for (const coingeckoName in user.alerts) {
      coingeckoNames.push(coingeckoName)
    }
    return coingeckoNames
  }).join(",")}&per_page=100&page=1&sparkline=false&price_change_percentage=24h`)).data
}

const getWeeklyCoingeckoData = async (users: DocumentType<User>[]) => {
  return (await axios.get(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=eur&ids=${users.map((user) => {
    const coingeckoNames = [];
    for (const coingeckoName in user.alerts) {
      coingeckoNames.push(coingeckoName)
    }
    return coingeckoNames
  }).join(",")}&per_page=100&page=1&sparkline=false&price_change_percentage=7d`)).data
}

const setUserHourlyNotifications = (user: DocumentType<User>, coingeckoData) => {
  const newNotifications = [] as AlertNotification[]
  for (const coingeckoName in user.alerts) {
    const coinData = coingeckoData.find((coin) => coin.id === coingeckoName)
    if (Math.abs(coinData.price_change_percentage_1h_in_currency) >= user.alerts[coingeckoName].hourPriceChange && user.alerts[coingeckoName].hourPriceChange !== 0) {
      newNotifications.push(
        {
          id: uuid4(),
          token: coingeckoName,
          createdAt: Date.now(),
          iconUrl: coinData.image,
          title: coinData.price_change_percentage_1h_in_currency > 0 ? `${coinData.name} is going up` : `${coinData.name} is going down`,
          message: coinData.price_change_percentage_1h_in_currency > 0 ? `Hour price alert: ${coinData.name} went up ${Math.floor(coinData.price_change_percentage_1h_in_currency * 100) / 100}%` : `Hour price alert: ${coinData.name} went down ${Math.floor(coinData.price_change_percentage_1h_in_currency * 100) / 100}%`,
          wasViewed: false,
          type: coinData.price_change_percentage_1h_in_currency > 0 ? "gain" : "loss"
        })

    }
  }

  const oldNotifications = user.notifications
  user.notifications = [...oldNotifications, ...newNotifications]
  return UserModel.findById(user._id)
    .then((foundUser) => {
      foundUser.notifications = [...oldNotifications, ...newNotifications]
      return foundUser.save()
    })
    .then(() => {
      newNotifications.forEach((notification) => {
        notifier.send(user._id.toString(), notification)
      })
      return true
    }, () => {
      return false
    })
}

const setUserDailyNotifications = (user: DocumentType<User>, coingeckoData) => {
  const newNotifications = [] as AlertNotification[]
  for (const coingeckoName in user.alerts) {
    const coinData = coingeckoData.find((coin) => coin.id === coingeckoName)
    if (Math.abs(coinData.price_change_percentage_24h_in_currency) >= user.alerts[coingeckoName].dayPriceChange && user.alerts[coingeckoName].dayPriceChange !== 0) {
      newNotifications.push(
        {
          id: uuid4(),
          token: coingeckoName,
          createdAt: Date.now(),
          iconUrl: coinData.image,
          title: coinData.price_change_percentage_24h_in_currency > 0 ? `${coinData.name} is going up` : `${coinData.name} is going down`,
          message: coinData.price_change_percentage_24h_in_currency > 0 ? `Day price alert: ${coinData.name} went up ${Math.floor(coinData.price_change_percentage_24h_in_currency * 100) / 100}%` : `Day price alert: ${coinData.name} went down ${Math.floor(coinData.price_change_percentage_24h_in_currency * 100) / 100}%`,
          wasViewed: false,
          type: coinData.price_change_percentage_24h_in_currency > 0 ? "gain" : "loss"
        })

    }
  }

  const oldNotifications = user.notifications
  user.notifications = [...oldNotifications, ...newNotifications]
  return UserModel.findById(user._id)
    .then((foundUser) => {
      foundUser.notifications = [...oldNotifications, ...newNotifications]
      return foundUser.save()
    })
    .then(() => {
      newNotifications.forEach((notification) => {
        notifier.send(user._id.toString(), notification)
      })
      return true
    }, () => {
      return false
    })
}

const setUserWeeklyNotifications = (user: DocumentType<User>, coingeckoData) => {
  const newNotifications = [] as AlertNotification[]
  for (const coingeckoName in user.alerts) {
    const coinData = coingeckoData.find((coin) => coin.id === coingeckoName)
    if (Math.abs(coinData.price_change_percentage_7d_in_currency) >= user.alerts[coingeckoName].weekPriceChange && user.alerts[coingeckoName].weekPriceChange !== 0) {
      newNotifications.push(
        {
          id: uuid4(),
          token: coingeckoName,
          createdAt: Date.now(),
          iconUrl: coinData.image,
          title: coinData.price_change_percentage_7d_in_currency > 0 ? `${coinData.name} is going up` : `${coinData.name} is going down`,
          message: coinData.price_change_percentage_7d_in_currency > 0 ? `Week price alert: ${coinData.name} went up ${Math.floor(coinData.price_change_percentage_7d_in_currency * 100) / 100}%` : `Week price alert: ${coinData.name} went down ${Math.floor(coinData.price_change_percentage_7d_in_currency * 100) / 100}%`,
          wasViewed: false,
          type: coinData.price_change_percentage_7d_in_currency > 0 ? "gain" : "loss"
        })

    }
  }

  const oldNotifications = user.notifications
  user.notifications = [...oldNotifications, ...newNotifications]
  return UserModel.findById(user._id)
    .then((foundUser) => {
      foundUser.notifications = [...oldNotifications, ...newNotifications]
      return foundUser.save()
    })
    .then(
      () => {
        newNotifications.forEach((notification) => {
          notifier.send(user._id.toString(), notification)
        })
        return true;
      },
      () => {
        return false;
      })
}


