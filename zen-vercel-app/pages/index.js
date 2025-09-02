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
        <meta property="og:image" content="https://zen-tracker.vercel.app/screenshots/12_zen.png" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://zen-tracker.vercel.app/" />
        <meta property="twitter:title" content="Zen - Minimalist Focus Timer for Deep Work" />
        <meta property="twitter:description" content="Track your daily activities and build better habits with Zen - a minimalist time tracking app for iOS." />
        <meta property="twitter:image" content="https://zen-tracker.vercel.app/screenshots/12_zen.png" />
        
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
              <svg className={styles.buttonIcon} width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.12997 6.91 8.81997 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
              </svg>
              Download for iOS
            </a>
            <a href="https://play.google.com/store/apps/details?id=com.anonymous.zenapp&pcampaignid=web_share" target="_blank" rel="noopener noreferrer" className={styles.primaryButton}>
              <svg className={styles.buttonIcon} width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.6 3 21.09 3 20.5ZM16.81 15.12L6.05 21.34L14.54 12.85L16.81 15.12ZM20.16 10.81C20.5 11.08 20.75 11.5 20.75 12C20.75 12.5 20.53 12.9 20.18 13.18L17.89 14.5L15.39 12L17.89 9.5L20.16 10.81ZM6.05 2.66L16.81 8.88L14.54 11.15L6.05 2.66Z"/>
              </svg>
              Download for Google Play
            </a>
          </div>
          <div className={styles.screenshotCarousel}>
            <div className={styles.screenshotContainer}>
              <img src="/screenshots/5_zen.png" alt="Zen App First Screen" className={styles.screenshot} />
              <img src="/screenshots/12_zen.png" alt="Zen App Home Screen" className={styles.screenshot} />
              <img src="/screenshots/7_zen.png" alt="Zen Timer Screen" className={styles.screenshot} />
              <img src="/screenshots/13_zen.png" alt="Zen Report Screen" className={styles.screenshot} />
            </div>
          </div>
        </section>

        <section className={styles.onboarding}>
          <h2>Stay Headache-Free</h2>
          <p className={styles.sectionDescription}>
            Get started in seconds with our simple setup process
          </p>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <img 
              src="/onboarding-demo.gif" 
              alt="Zen App Demo" 
              style={{ 
                maxWidth: '10%', 
                height: 'auto', 
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }} 
            />
          </div>
          <div className={styles.onboardingSteps}>
            <div className={styles.onboardingStep}>
              <img src="/screenshots/1_zen.png" alt="Welcome Screen" className={styles.onboardingImage} />
              {/* <h3>Welcome</h3> */}
              {/* <p>A clean, minimalist start to your focus journey</p> */}
            </div>
            <div className={styles.onboardingStep}>
              <img src="/screenshots/2_zen.png" alt="Create Activities" className={styles.onboardingImage} />
              {/* <h3>Create Activities</h3> */}
              {/* <p>Track different types of work</p> */}
            </div>
            <div className={styles.onboardingStep}>
              <img src="/screenshots/3_zen.png" alt="Set Target" className={styles.onboardingImage} />
              {/* <h3>Set Your Target</h3> */}
              {/* <p>Choose your focus duration or go unlimited</p> */}
            </div>
            <div className={styles.onboardingStep}>
              <img src="/screenshots/4_zen.png" alt="Track Progress" className={styles.onboardingImage} />
              {/* <h3>Track Progress</h3> */}
              {/* <p>View your focus history and build consistency</p> */}
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
              <img src="/screenshots/13_zen.png" alt="Timeline View" className={styles.reportScreenshot} />
              <img src="/screenshots/14_zen.png" alt="Rings View" className={styles.reportScreenshot} />
            </div>
          </div>
        </section>

        <section id="download" className={styles.download}>
          <h2>Start Your Journey Today</h2>
          <p className={styles.downloadDescription}>
            Join thousands of users who have transformed their daily routines with Zen
          </p>
          <div className={styles.ctaButtons}>
            <a href="https://apps.apple.com/kr/app/zen/id6749873242" target="_blank" rel="noopener noreferrer" className={styles.primaryButton}>
              <svg className={styles.buttonIcon} width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.12997 6.91 8.81997 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
              </svg>
              Download for iOS
            </a>
            <a href="https://play.google.com/store/apps/details?id=com.anonymous.zenapp&pcampaignid=web_share" target="_blank" rel="noopener noreferrer" className={styles.primaryButton}>
              <svg className={styles.buttonIcon} width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.6 3 21.09 3 20.5ZM16.81 15.12L6.05 21.34L14.54 12.85L16.81 15.12ZM20.16 10.81C20.5 11.08 20.75 11.5 20.75 12C20.75 12.5 20.53 12.9 20.18 13.18L17.89 14.5L15.39 12L17.89 9.5L20.16 10.81ZM6.05 2.66L16.81 8.88L14.54 11.15L6.05 2.66Z"/>
              </svg>
              Download for Google Play
            </a>
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
            <a href="/privacy-policy">Privacy Policy</a>
            <a href="/support">Support</a>
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