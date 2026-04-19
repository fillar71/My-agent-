import { Octokit } from "@octokit/rest";

export async function pushToGithub(
  token: string,
  ownerRepo: string,
  branch: string,
  commitMessage: string,
  files: Record<string, string>
) {
  const octokit = new Octokit({ auth: token });
  const [owner, repo] = ownerRepo.split("/");

  if (!owner || !repo) {
    throw new Error("Repository must be in format 'owner/repo'");
  }

  let commitSha: string | undefined;
  let treeSha: string | undefined;

  // Try to get the current commit object
  try {
    const { data: refData } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    });
    commitSha = refData.object.sha;

    const { data: commitData } = await octokit.git.getCommit({
      owner,
      repo,
      commit_sha: commitSha,
    });
    treeSha = commitData.tree.sha;
  } catch (error: any) {
    // 409 Conflict usually means "Git Repository is empty"
    // 404 Not Found means the branch doesn't exist (but repo might have other branches)
    if (error.status !== 409 && error.status !== 404 && error.status !== 422) {
      throw error;
    }
  }

  // Create blobs and tree items
  const tree = await Promise.all(
    Object.entries(files).map(async ([path, content]) => {
      // Remove leading slash if present
      const cleanPath = path.startsWith("/") ? path.slice(1) : path;
      
      const { data: blobData } = await octokit.git.createBlob({
        owner,
        repo,
        content,
        encoding: "utf-8",
      });

      return {
        path: cleanPath,
        mode: "100644" as const,
        type: "blob" as const,
        sha: blobData.sha,
      };
    })
  );

  // Create a new tree
  const treeParams: any = {
    owner,
    repo,
    tree,
  };
  if (treeSha) {
    treeParams.base_tree = treeSha;
  }

  const { data: newTree } = await octokit.git.createTree(treeParams);

  // Create a new commit
  const commitParams: any = {
    owner,
    repo,
    message: commitMessage,
    tree: newTree.sha,
  };
  if (commitSha) {
    commitParams.parents = [commitSha];
  }

  const { data: newCommit } = await octokit.git.createCommit(commitParams);

  // Update or create the reference
  try {
    if (commitSha) {
      await octokit.git.updateRef({
        owner,
        repo,
        ref: `heads/${branch}`,
        sha: newCommit.sha,
      });
    } else {
      await octokit.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branch}`,
        sha: newCommit.sha,
      });
    }
  } catch (error: any) {
    // If updateRef fails, maybe try createRef as fallback just in case
    if (error.status === 422 || error.status === 404) {
      await octokit.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branch}`,
        sha: newCommit.sha,
      });
    } else {
      throw error;
    }
  }

  return newCommit.html_url;
}
