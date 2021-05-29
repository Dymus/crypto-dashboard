from pymongo import MongoClient
import praw
import datetime, time
from bs4 import BeautifulSoup
import requests
import json
from decouple import config

print("Started running the script")

# Acessing the Reddit API
reddit = praw.Reddit(client_id=config('CLIENT_ID'),#my client id
                     client_secret=config('CLIENT_SECRET'),  #your client secret
                     user_agent=config('USER_AGENT'), #user agent name
                     username="UCNCryptoDashboard",     # your reddit username
                     password=config('PASSWORD')) # your reddit passowrd
# MongoDB client initialization
client = MongoClient(config('MONGO_URI'))
our_database = client['CryptoDashboard']
news = our_database['news']
# Specifying subreddits to scrape
subreddits = ['CryptoCurrency', 'CryptoCurrencies', 'CryptoCurrencyTrading']
# Specifying coins to look for
cryptocurrencies = []
response = requests.get('https://api.coingecko.com/api/v3/coins/markets?vs_currency=eur&order=market_cap_desc&per_page=100&page=1&sparkline=false').text
response_info = json.loads(response)
 
for coin in response_info:
    cryptocurrencies.append(coin['name'])

while True:
    urls = {}
    titles = {}
    our_database.news.drop()
    
    for cryptocurrency in cryptocurrencies:
        print(cryptocurrency)

        # Scraping cryptonews for specific crypto and saving to database
        r = requests.get(f'https://cryptonews.com/search/?q={cryptocurrency}')
        if r:
            soup = BeautifulSoup(r.content, 'html.parser')
            title = soup.find_all('h4')
            url = soup.find_all('a', {'class': 'img'})
            image = soup.find_all('img', {'class': 'lazyload'})

            for i in range(3):
                news.insert_one({'cryptocurrency': cryptocurrency, 'image' : image[i]['data-src'], 'top': i+1, 'subreddit': 'CryptoNews', 'url': 'https://cryptonews.com' + url[i]['href'], 'title': title[i].contents[0].text})
        else:
            print('Invalid web page!')

        # Scraping reddit for specific crypto and saving to database
        for sub in subreddits:
            urls[sub] = []
            titles[sub] = []

        for sub in subreddits:
            subreddit = reddit.subreddit(sub)
            for submission in subreddit.search(cryptocurrency, sort = "top", limit = 3, time_filter="week"):
                urls[f'{subreddit}'].append(submission.url)
                titles[f'{subreddit}'].append(submission.title)

        #Saving to database
        for sub in subreddits:
            for i in range(len(urls[sub])):
                if 'http' in urls[sub][i]:
                    r = requests.get(urls[sub][i])
                    if r:
                        soup = BeautifulSoup(r.content,'html.parser')
                        image = soup.find('meta',property='og:image')
                        image_url = image['content'] if image else 'https://www.mcleodgaming.com/wp-content/uploads/2019/05/reddit_logo-150x150.png'
                    else:
                        image_url = 'https://www.mcleodgaming.com/wp-content/uploads/2019/05/reddit_logo-150x150.png'
                    news.insert_one({'cryptocurrency': cryptocurrency, 'scraped_at': datetime.datetime.now(), 'image' : image_url, 'top': i+1, 'subreddit': sub, 'url': urls[sub][i], 'title': titles[sub][i]})

    #Wait for 1 hour            
    time.sleep(3600)