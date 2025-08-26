import Head from 'next/head'
import styles from '../styles/Home.module.css'

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Zen - Minimalist Focus Timer for Deep Work</title>
        <meta name="description" content="Track your daily activities and build better habits with Zen - a minimalist time tracking app for iOS. Focus on what matters with our simple, privacy-first approach." />
        <meta name="keywords" content="focus timer, time tracking, productivity app, deep work, pomodoro, minimalist app, iOS app, habit tracker" />
        <meta name="author" content="Kiboko AI" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://zen-tracker.vercel.app/" />
        <meta property="og:title" content="Zen - Minimalist Focus Timer for Deep Work" />
        <meta property="og:description" content="Track your daily activities and build better habits with Zen - a minimalist time tracking app for iOS." />
        <meta property="og:image" content="https://zen-tracker.vercel.app/screenshots/6_zen.png" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://zen-tracker.vercel.app/" />
        <meta property="twitter:title" content="Zen - Minimalist Focus Timer for Deep Work" />
        <meta property="twitter:description" content="Track your daily activities and build better habits with Zen - a minimalist time tracking app for iOS." />
        <meta property="twitter:image" content="https://zen-tracker.vercel.app/screenshots/6_zen.png" />
        
        {/* Apple App Store */}
        <meta name="apple-itunes-app" content="app-id=6749873242" />
        
        {/* Viewport for mobile */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://zen-tracker.vercel.app/" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <nav className={styles.nav}>
        <div className={styles.navContainer}>
          <div className={styles.logo}>Zen</div>
          <div className={styles.navLinks}>
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            <a href="#download">Download</a>
          </div>
        </div>
      </nav>

      <main className={styles.main}>
        <section className={styles.hero}>
          <h1 className={styles.title}>
            A Minimalist Focus Timer
          </h1>
          <p className={styles.subtitle}>
            for Deep Work
          </p>
          <p className={styles.description}>
            Track your time, build better habits, and achieve your goals with Zen's simple approach to time tracking
          </p>
          <div className={styles.ctaButtons}>
            <a href="https://apps.apple.com/kr/app/zen/id6749873242" target="_blank" rel="noopener noreferrer" className={styles.primaryButton}>
              Download for iOS
            </a>
            <button className={styles.secondaryButton} disabled>
              Google Play (Coming Soon)
            </button>
          </div>
          <div className={styles.screenshotCarousel}>
            <div className={styles.screenshotContainer}>
              <img src="/screenshots/5_zen.png" alt="Zen App First Screen" className={styles.screenshot} />
              <img src="/screenshots/6_zen.png" alt="Zen App Home Screen" className={styles.screenshot} />
              <img src="/screenshots/7_zen.png" alt="Zen Timer Screen" className={styles.screenshot} />
              <img src="/screenshots/8_zen.png" alt="Zen Report Screen" className={styles.screenshot} />
            </div>
          </div>
        </section>

        <section className={styles.onboarding}>
          <h2>Intuitive Onboarding</h2>
          <p className={styles.sectionDescription}>
            Get started in seconds with our simple setup process
          </p>
          <div className={styles.onboardingSteps}>
            <div className={styles.onboardingStep}>
              <img src="/screenshots/1_zen.png" alt="Welcome Screen" className={styles.onboardingImage} />
              <h3>Welcome</h3>
              <p>A clean, minimalist start to your focus journey</p>
            </div>
            <div className={styles.onboardingStep}>
              <img src="/screenshots/2_zen.png" alt="Create Activities" className={styles.onboardingImage} />
              <h3>Create Activities</h3>
              <p>Track different types of work</p>
            </div>
            <div className={styles.onboardingStep}>
              <img src="/screenshots/3_zen.png" alt="Set Target" className={styles.onboardingImage} />
              <h3>Set Your Target</h3>
              <p>Choose your focus duration or go unlimited</p>
            </div>
            <div className={styles.onboardingStep}>
              <img src="/screenshots/4_zen.png" alt="Track Progress" className={styles.onboardingImage} />
              <h3>Track Progress</h3>
              <p>View your focus history and build consistency</p>
            </div>
          </div>
        </section>

        <section id="features" className={styles.features}>
          <h2>Simple Yet Essential</h2>
          <div className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>◯</div>
              <h3>Easy Time Tracking</h3>
              <p>Start and stop timers with a single tap. No complicated setup required.</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>▦</div>
              <h3>Insightful Reports</h3>
              <p>Visualize your time with beautiful charts and detailed statistics.</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>◎</div>
              <h3>Goal Setting</h3>
              <p>Set daily targets and track your progress towards your goals.</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>◐</div>
              <h3>Minimalist Design</h3>
              <p>Clean, distraction-free interface that helps you focus on what matters.</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>▣</div>
              <h3>Works Offline</h3>
              <p>Track your time anywhere, anytime. No internet connection required.</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>◉</div>
              <h3>Privacy First</h3>
              <p>Your data stays on your device. No accounts, no cloud, no tracking.</p>
            </div>
          </div>
        </section>

        <section id="how-it-works" className={styles.howItWorks}>
          <div className={styles.reportViews}>
            <h2>Comprehensive Reports</h2>
            <p className={styles.sectionDescription}>
              Track your progress with beautiful visualizations. View daily, weekly, monthly, and yearly statistics to understand your focus patterns.
            </p>
            <div className={styles.reportScreenshots}>
              <img src="/screenshots/8_zen.png" alt="Timeline View" className={styles.reportScreenshot} />
              <img src="/screenshots/9_zen.png" alt="Rings View" className={styles.reportScreenshot} />
            </div>
          </div>
        </section>

        <section id="download" className={styles.download}>
          <h2>Start Your Journey Today</h2>
          <p className={styles.downloadDescription}>
            Join thousands of users who have transformed their daily routines with Zen
          </p>
          <div className={styles.downloadButtons}>
            <a href="https://apps.apple.com/kr/app/zen/id6749873242" target="_blank" rel="noopener noreferrer" className={styles.appStoreButton}>
              Download on App Store
            </a>
            <button className={styles.playStoreButton} disabled>
              Google Play (Coming Soon)
            </button>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerSection}>
            <h4>Zen</h4>
            <p>Focus on what matters</p>
          </div>
          <div className={styles.footerSection}>
            <h4>Links</h4>
            <span style={{color: '#666', display: 'block', marginBottom: '0.5rem', cursor: 'not-allowed'}}>Privacy Policy</span>
            <span style={{color: '#666', display: 'block', marginBottom: '0.5rem', cursor: 'not-allowed'}}>Terms of Service</span>
            <span style={{color: '#666', display: 'block', marginBottom: '0.5rem', cursor: 'not-allowed'}}>Support</span>
          </div>
          <div className={styles.footerSection}>
            <h4>Contact</h4>
            <a href="mailto:dev@kiboko.ai">dev@kiboko.ai</a>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>&copy; 2025 Zen. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}