import {http} from './lib/http';

function getUserName() {
  const matcher = location.href.match(/https:\/\/github\.com\/(\w+)\??/);
  return matcher[1];
}

function shouldRun() {
  return /https:\/\/github\.com\/\w+\?/.test(location.href) && location.search.indexOf('tab=repositories') >= 0;
}

function getRepositories() {
  return [].slice.call(document.querySelectorAll('.js-repo-list>li'))
    .filter(li => !li.getAttribute('contribute-ratio'))
    .map(function (li) {
      const a = li.querySelector('h3>a');
      const match = a.pathname.match(/([^\/]+)\/([^\/]+)/);
      li.setAttribute('repository-owner', match[1]);
      li.setAttribute('repository-name', match[2]);
      return li;
    });
}

async function main() {
  if (!shouldRun()) return;

  const userName = getUserName();
  console.info(`Stating ${userName}'s contribution...`);
  const lis: any[] = getRepositories();

  if (!lis.length) return;

  clearInterval(timer);
  timer = void 0;

  lis.forEach(function (li) {
    const owner = li.getAttribute('repository-owner');
    const name = li.getAttribute('repository-name');
    http.get(`/repos/${owner}/${name}/stats/contributors`)
      .then(function (res) {
        const raw = res.response;
        if (!raw) return;
        let response: object[] = JSON.parse(raw);

        response = Object.keys(response).length === 0 ? [] : response;

        const contributes: any[] = response.filter(v => v["author"]["login"] === userName).map(v => v);

        let totalAdditions = 0;
        let totalDeletions = 0;
        let additions = 0;
        let deletions = 0;

        contributes.forEach((contribute: any) => {
          contribute.weeks.forEach((week) => (additions += week.a) && (deletions += week.d));
        });

        response.forEach((contribute: any) => {
          contribute.weeks.forEach((week) => (totalAdditions += week.a) && (totalDeletions += week.d));
        });

        let contributeRatio = (((additions + deletions) / (totalAdditions + totalDeletions)) * 100) + '';

        li.setAttribute('total-additions', totalAdditions);
        li.setAttribute('total-deletions', totalDeletions);
        li.setAttribute('additions', additions);
        li.setAttribute('deletions', deletions);
        li.setAttribute('contribute-ratio', parseInt(contributeRatio));

        const percent = parseInt(contributeRatio) > 0 ? parseInt(contributeRatio) : 1;

        const uncontribution = document.createElement('span');
        const contribution = document.createElement('span');
        const container = document.createElement('span');
        container.setAttribute('aria-label', `Contribution ${percent}%`);

        const width = 155;

        container.classList.add('d-inline-block');
        container.classList.add('tooltipped');
        container.classList.add('tooltipped-s');
        container.style.width = '155px';

        const contributionWidth = width * percent / 100;

        contribution.style.width = contributionWidth + 'px';
        contribution.style.borderBottom = '2px solid #009688';
        contribution.style.display = 'inline-block';

        uncontribution.style.width = width - contributionWidth + 'px';
        uncontribution.style.borderBottom = '2px solid #9E9E9E';
        uncontribution.style.display = 'inline-block';

        container.appendChild(contribution);
        container.appendChild(uncontribution);
        li.querySelector('.col-3.float-right.text-right').appendChild(container);
      })
      .catch(function (err) {
        console.error(err);
      });
  });
}

(function (history: History) {
  const pushState = history.pushState;
  history.pushState = function (state) {
    if (typeof history["onpushstate"] == "function") {
      history["onpushstate"]({state: state});
    }
    setTimeout(function () {
      run();
    });
    return pushState.apply(history, arguments);
  }
})(window.history);

let timer;

function run() {
  if (!shouldRun()) return;
  timer = setInterval(function () {
    main();
  }, 1500);
}

run();