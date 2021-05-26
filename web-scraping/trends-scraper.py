from pymongo import MongoClient
import praw
import datetime, time
from bs4 import BeautifulSoup
import requests
import json

print("Started running the script")

# Acessing the Reddit API
reddit = praw.Reddit(
    client_id="fEa4it1xgroveg",  # my client id
    client_secret="UMVpzgGog9y7MnbE7CRHmKjAbbHDzA",  # your client secret
    user_agent="CryptoDashboard",  # user agent name
    username="UCNCryptoDashboard",  # your reddit username
    password="UCNcryptoDASHBOARDsuperSECUREstring",
)  # your reddit password
# MongoDB client initialization
client = MongoClient(
    "mongodb+srv://sa:CryptoDashboard@cryptodashboard.0obwg.mongodb.net/CryptoDashboard"
)
our_database = client["CryptoDashboard"]
trends = our_database["trends"]
hots = our_database['hots']
cryptocurrencies = []

# Specifying subreddits to scrape
subreddits = [
    "CryptoCurrency",
    "CryptoCurrencies",
    "CryptoCurrencyTrading",
]  # make a list of subreddits you want to scrape the data from

response = requests.get('https://api.coingecko.com/api/v3/coins/markets?vs_currency=eur&order=market_cap_desc&per_page=200&page=1&sparkline=false').text
response_info = json.loads(response)
 
for coin in response_info:
    cryptocurrencies.append(coin['name'])

while True:
    for cryptocurrency in cryptocurrencies:
        print(cryptocurrency)
        count = 0

        for sub in subreddits:
            subreddit = reddit.subreddit(sub)
            for submission in subreddit.search(
                cryptocurrency, sort="top", limit=None, time_filter="day"
            ):
                count += 1

        # Getting a timestamp
        now = datetime.datetime.now()
        timestamp = now.strftime("%Y-%m-%d %H:%M:%S")

        # Write to MongoDB
        trends.insert_one(
            {"cryptocurrency": cryptocurrency, "scraped_at": now, "count": count}
        )

    '''
    urls = []
    titles = []
    scores = []
    dates = []
    our_database.hots.delete_many({})
    for submission in reddit.subreddit("CryptoCurrency").hot(limit=10):
        urls.append(submission.url)
        titles.append(submission.title)
        scores.append(submission.score)
        dates.append(submission.created_utc)
    for i in range(len(urls)):
        r = requests.get(urls[sub][i])
        if r:
            soup = BeautifulSoup(requests.get(urls[i]).content,'html.parser')
            image = soup.find('meta', property='og:image')
            image_url = image['content'] if image else 'https://www.mcleodgaming.com/wp-content/uploads/2019/05/reddit_logo-150x150.png'
        else:
            image_url = 'https://www.mcleodgaming.com/wp-content/uploads/2019/05/reddit_logo-150x150.png'
        hots.insert_one({'title': titles[i], 'score': scores[i], 'url': urls[i], 'image' : image_url})
    '''
    time.sleep(900)