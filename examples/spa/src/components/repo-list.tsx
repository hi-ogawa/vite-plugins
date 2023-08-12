type ReposResponse = {
  repos: {
    id: number;
    name: string;
    repo: string;
    description: string;
    stars: number;
  }[];
};

export function RepoListComponent(props: { data: ReposResponse }) {
  return (
    <table border={1}>
      <thead>
        <tr>
          <th>name</th>
          <th>description</th>
          <th>star</th>
        </tr>
      </thead>
      <tbody>
        {props.data.repos.map((repo) => (
          <tr key={repo.id}>
            <td>
              <a href={`https://github.com/${repo.repo}`} target="_blank">
                {repo.name}
              </a>
            </td>
            <td>{repo.description}</td>
            <td>{repo.stars}</td>
          </tr>
        ))}
        <tr></tr>
      </tbody>
    </table>
  );
}
